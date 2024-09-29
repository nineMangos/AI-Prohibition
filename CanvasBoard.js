import { lib, game, ui, get, ai, _status } from "../../noname.js";

class Rectangle {
	constructor(fillColor, strokeColor, cvs, startX, startY) {
		this.startX = startX / game.documentZoom;
		this.startY = startY / game.documentZoom;
		this.cvs = cvs;
		this.ctx = cvs.ctx;
		this.endX = this.startX;
		this.endY = this.startY;

		this.fillColor = fillColor;
		this.strokeColor = strokeColor;
	}

	get minX() {
		return Math.min(this.startX, this.endX);
	}
	get maxX() {
		return Math.max(this.startX, this.endX);
	}
	get minY() {
		return Math.min(this.startY, this.endY);
	}
	get maxY() {
		return Math.max(this.startY, this.endY);
	}

	draw() {
		const ctx = this.ctx;
		ctx.beginPath();
		ctx.moveTo(this.minX * devicePixelRatio, this.minY * devicePixelRatio);
		ctx.lineTo(this.maxX * devicePixelRatio, this.minY * devicePixelRatio);
		ctx.lineTo(this.maxX * devicePixelRatio, this.maxY * devicePixelRatio);
		ctx.lineTo(this.minX * devicePixelRatio, this.maxY * devicePixelRatio);
		ctx.lineTo(this.minX * devicePixelRatio, this.minY * devicePixelRatio);
		ctx.fillStyle = this.fillColor;
		ctx.fill();
		ctx.strokeStyle = this.strokeColor;
		ctx.lineCap = 'square';
		ctx.lineWidth = 1 * devicePixelRatio;
		ctx.stroke();
	}
}

class CanvasBoard extends HTMLCanvasElement {
	seletor //选择器
	fillColor; //选框颜色
	strokeColor; //选框边框颜色
	ctx; //画布上下文

	status = {
		shape: void 0, //当前绘制的图形
		element: void 0, //当前操作的元素,
		scrollTop: void 0, //记录的初始滚动条位置,
		virtualRect: void 0, //虚拟选框
	}

	/**
	 * @param { HTMLElement } parentNode 父元素
	 * @param { HTMLDivElement } seletor 选择器
	 * @param { string? } fillColor 选框颜色
	 * @param { string? } strokeColor 选框边框颜色
	 */
	constructor(parentNode, seletor, fillColor = 'rgba(0,119,255,0.2)', strokeColor = "rgb(0,119,255)") {
		const cvs = document.createElement('canvas');
		Object.setPrototypeOf(cvs, CanvasBoard.prototype);

		parentNode.style.position = 'relative';
		parentNode.appendChild(cvs);
		cvs.style.cssText = 'background-color: rgba(170, 170, 170, 0); pointer-events: none; z-index: 100; position: absolute; top:0 ; left:0';
		cvs.status = {};
		cvs.fillColor = fillColor;
		cvs.strokeColor = strokeColor;
		cvs.seletor = seletor;
		cvs.ctx = cvs.getContext('2d');
		cvs.width = 0;
		cvs.height = 0;
		return cvs;
	}
	hanldleMouseDown(element, oriEvt) {
		const width = this.parentNode.offsetWidth;
		const height = this.parentNode.offsetHeight;
		this.width = width * devicePixelRatio;
		this.height = height * devicePixelRatio;
		this.style.width = width + 'px';
		this.style.height = height + 'px';

		const fillColor = this.fillColor;
		const strokeColor = this.strokeColor;
		const { x, y } = this.getRelativePositionInElement(this.parentNode, oriEvt.clientX, oriEvt.clientY);
		const { offsetX, offsetY } = oriEvt;
		const shape = new Rectangle(fillColor, strokeColor, this, x, y);
		this.status.shape = shape;
		this.status.element = element;
		this.status.scrollTop = element.scrollTop;
		shape.initialY = y;
		this.status.virtualRect = {
			startX: offsetX,
			startY: offsetY
		}

		const bounding = this.getBoundingClientRect();
		this.draw();
		// 定义一个处理鼠标移动的函数
		const handleMouseMove = e => {
			shape.endX = Math.min(Math.max((e.clientX - bounding.left) / game.documentZoom, 0), this.width / devicePixelRatio);
			shape.endY = (e.clientY - bounding.top) / game.documentZoom;
			this.scrollOnDrag(element, e.clientY);
		}
		// 定义一个处理鼠标抬起的函数
		const handleMouseUp = e => {
			const buttons = this.seletor.buttonsArr;
			const virRect = this.getVirtualRect();
			let zoom = +window.getComputedStyle(this.seletor.querySelector('.characterList .content>.buttons')).zoom * +window.getComputedStyle(document.documentElement).getPropertyValue('--sl-layout-zoom');
			if (typeof zoom !== 'number' || !zoom) zoom = 1
			if (buttons) buttons.forEach(btn => {
				if (this.doRectanglesIntersect(this.getRectangle(btn, zoom), virRect)) {
					if (e.shiftKey) return;
					this.seletor.interactionModel[(e.ctrlKey || e.metaKey) ? 'hanldleCharBtnUnselect' : 'hanldleCharBtnSelect'](btn);
				}
			})
			this.status.shape = null;
			this.ctx.clearRect(0, 0, this.width, this.height);
			delete this.status.element;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	/**
	 * 获取鼠标在 element 元素内的相对位置
	 * @param { HTMLElement } element 
	 * @param { number } clientX e.clientX
	 * @param { number } clientY e.clientY
	 * @returns 
	 */
	getRelativePositionInElement(element, clientX, clientY) {
		const rect = element.getBoundingClientRect();
		const { left, top } = rect;
		const { scrollLeft, scrollTop, scrollWidth, scrollHeight } = element;
		let x = clientX - left + scrollLeft;
		let y = clientY - top + scrollTop;
		if (x < 0) {
			x = 0;
		}
		if (y < 0) {
			y = 0;
		}

		return { x: Math.round(x), y: Math.round(y) };
	}

	getRectangle(node, zoom) {
		return {
			startX: node.offsetLeft * zoom,
			startY: node.offsetTop * zoom,
			endX: (node.offsetLeft + node.offsetWidth) * zoom,
			endY: (node.offsetTop + node.offsetHeight) * zoom,
		}
	}

	getVirtualRect() {
		const startX = this.status.virtualRect.startX,
			startY = this.status.virtualRect.startY,
			endX = this.status.shape.endX,
			endY = this.status.shape.endY + this.status.element.scrollTop

		return {
			startX: Math.min(startX, endX),
			startY: Math.min(startY, endY),
			endX: Math.max(startX, endX),
			endY: Math.max(startY, endY),
		}
	}
	// 判断两个矩形是否有重叠
	doRectanglesIntersect(rect1, rect2) {
		// 获取矩形的边界值
		const left1 = rect1.startX;
		const right1 = rect1.endX;
		const top1 = rect1.startY;
		const bottom1 = rect1.endY;

		const left2 = rect2.startX;
		const right2 = rect2.endX;
		const top2 = rect2.startY;
		const bottom2 = rect2.endY;

		// 检查是否有重叠
		const xOverlap = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
		const yOverlap = Math.max(0, Math.min(bottom1, bottom2) - Math.max(top1, top2));

		return (xOverlap > 0) && (yOverlap > 0);
	}
	//当鼠标超出元素边界时自动滚动元素。
	scrollOnDrag(element, mouseY) {
		const { y, height } = element.getBoundingClientRect();

		let scrollY;

		if (mouseY < y) {
			scrollY = mouseY - y;
		} else if (mouseY > (y + height)) {
			scrollY = mouseY - (y + height);
		}

		if (scrollY) {
			element.scrollBy({
				top: scrollY,
				behavior: 'auto'
			});
		}
	}
	draw() {
		requestAnimationFrame(this.draw.bind(this));
		this.ctx.clearRect(0, 0, this.width, this.height);
		if (this.status.shape) {
			if (this.status.shape.initialY && this.status.element && this.status.element.scrollTop) {
				this.status.shape.startY = this.status.shape.initialY / game.documentZoom - this.status.element.scrollTop + this.status.scrollTop;
			}
			this.status.shape.draw();
		}
	}
}

export default CanvasBoard;

