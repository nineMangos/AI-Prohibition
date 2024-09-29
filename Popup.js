import { lib, game, ui, get, ai, _status } from "../../noname.js";

class Popup extends HTMLDivElement {
	container
	header
	caption
	close
	content
	constructor(bool) {
		const popupContainer = document.getElementById('popupContainer');
		const popup = ui.create.div('.popup', popupContainer);
		Object.setPrototypeOf(popup, Popup.prototype);
		const header = ui.create.div('.header', popup);
		const caption = document.createElement('h2');
		const closeNode = document.createElement('span');
		closeNode.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', popup.close.bind(popup));
		header.appendChild(caption);
		header.appendChild(closeNode);
		const content = ui.create.div('.content', popup);
		popup.container = popupContainer;
		popup.caption = caption;
		popup.header = header;
		popup.closeNode = closeNode;
		popup.content = content;
		if (bool) popup.open();
		return popup;
	}
	close(e) {
		if (e) this.container.style.display = 'none';
		this.container.removeChild(this);
		const audio = game.playAudio('../extension/AI禁将/audio/click5');
		audio.volume = 1;
	}
	open() {
		this.container.style.display = 'block';
		this.container.appendChild(this);
	}
	setCaption(caption) {
		this.caption.innerHTML = caption;
	}
	setContent(content) {
		this.content.innerHTML = content;
	}
	getConfigElements() {
		const nodeList = this.content.querySelectorAll('[data-id]');
		const config = {};
		for (let i = 0; i < nodeList.length; i++) {
			config[nodeList[i].getAttribute('data-id')] = nodeList[i];
		}
		return config;
	}
}

export default Popup;
