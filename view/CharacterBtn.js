import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import config from "../asset/config.js";

/**@extends HTMLDivElement */
export default class CharacterBtn {
	/** @type {string} 武将id */
	name;
	/** @type {boolean} 是否不可选 */
	isUnselectable;
	/**
	 * @param {string} id 武将id
	 * @param {string[]} selectedBannedList 已选择武将id数组
	 */
	constructor(id, selectedBannedList) {
		const button = ui.create.button(id, 'character', false);
		Object.setPrototypeOf(CharacterBtn.prototype, Object.getPrototypeOf(button));
		Object.setPrototypeOf(button, this);
		button.classList.add('item');
		button.setAttribute('data-name', id);
		button.name = id;
		if (!config.defaultImage) {
			button.setAttribute('data-src', button.style.backgroundImage);
		}
		button.style.backgroundImage = `url(${lib.assetURL}extension/AI禁将/image/default_character.jpg)`;
		//根据情况渲染武将牌的“不可选”状态
		if (window['AI禁将_savedFilter'](id)) {
			button.unselectable();
			return button;
		}
		//根据情况渲染“锁链”提示（tip）
		if (selectedBannedList.includes(id) || lib.filter.characterDisabled(id)) {
			button.select();
		}
		//根据情况渲染武将牌的“小黑屋”状态
		if (lib.filter.characterDisabled(id)) {
			button.block();
		}
		return button;
	}
	//设置不可选样式
	unselectable() {
		// this.style.opacity = '0.5';
		this.isUnselectable = true;
		this.style.setProperty('opacity', '0.5', 'important');
	}
	//获取选择样式元素
	getSelected() {
		return this.querySelector('.tip');
	}
	//设置选择样式（锁链）
	select() {
		if (this.isUnselectable) return;
		if (!this.getSelected()) ui.create.div('.tip', this);
	}
	//设置取消选择样式（解除锁链）
	unselect() {
		const tip = this.getSelected();
		if (tip) this.removeChild(tip);
	}
	/** * @returns {boolean} 切换选择样式 */
	toggleSelect() {
		if (this.isUnselectable) return;
		if (this.getSelected()) {
			this.unselect();
			return false;
		} else {
			this.select();
			return true;
		}
	}
	//获取选择样式元素
	getBlock() {
		return this.querySelector('.isselected');
	}
	//设置已被选择样式（小黑屋）
	block() {
		if (this.getBlock()) return;
		const selected = ui.create.div('.isselected');
		selected.style.borderRadius = window.getComputedStyle(this).borderRadius;
		this.insertBefore(selected, this.firstElementChild);
	}
	//设置取消已被选择样式（移除小黑屋）
	unblock() {
		const block = this.getBlock();
		if (block) this.removeChild(block);
	}
	//自动加入/移除小黑屋
	autoblock() {
		if (this.getSelected()) this.block();
		else this.unblock();
	}
}

