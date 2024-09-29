import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import SelectorController from '../controller/SelectorController.js';
import config from "../asset/config.js";

export default class SelectorModel {
	/** * @type { string[] } 缓存 getAllCharactersId() 的返回值*/
	#allCharactersId;
	/** * @type { SelectorController } */
	controller
	/**
	 * 获取所有的武将包id数组，数组的首项加上 'all'
	 */
	getPackListId() {
		const packlist = [];
		for (let i = 0; i < lib.config.all.characters.length; i++) {
			if (!lib.config.characters.includes(lib.config.all.characters[i])) continue;
			packlist.push(lib.config.all.characters[i]);
		}
		for (let i in lib.characterPack) {
			if (!lib.config.all.characters.includes(i) && Object.keys(lib.characterPack[i]).length) {
				packlist.push(i);
			}
		}
		packlist.unshift("all");
		return packlist;
	}
	/**
	 * 获取所有的武将包分类id数组，数组的首项加上 'all'
	 */
	getPackCategoriesId() {
		const mode = config.currentActiveMode;
		const pack = config.currentActivePackId;
		switch (mode) {
			case '默认':
				return ['all', ...Object.keys(lib.characterSort[pack] || {})];
			case '评级':
				return ['all', ...Object.keys(lib.rank.rarity)];
			case '势力':
				return ['all', ...lib.group];
			case '性别':
				return ['all', 'male', 'female', 'double', 'none'];
		}
	}
	/**
	 * 获取所有的武将id数组，并将返回结果缓存在 this.#allCharactersId 中
	 */
	getAllCharactersId() {
		if (!this.#allCharactersId) {
			this.#allCharactersId = Object.keys(lib.character);
		}
		return this.#allCharactersId;
	}
	/**
	 * 获取所有或某一个武将包下的武将id数组
	 * @param {string} pack 'all' 或 武将包id
	 */
	getPackCharactersId(pack) {
		if (pack === 'all') return this.getAllCharactersId();
		return Object.keys(lib.characterPack[pack]);
	}
	/**
	 * 根据当前武将包id、模式和分类等过滤条件来获取武将id数组
	 */
	getCurrentCharactersId() {
		const mode = config.currentActiveMode;
		const pack = config.currentActivePackId;
		const packCategories = config.currentActivePackCategoryId;
		const characters = (() => {
			if (pack === 'all') {
				if (packCategories === 'all') return this.getAllCharactersId();
				switch (mode) {
					case '默认':
						return [];
					case '评级':
						return lib.rank.rarity[packCategories];
					case '势力':
						return this.getAllCharactersId().filter(id => lib.character[id].group === packCategories || lib.character[id][1] === packCategories);
					case '性别':
						return this.getAllCharactersId().filter(id => lib.character[id].sex === packCategories || lib.character[id][0] === packCategories);
				}
			} else if (packCategories === "all") {
				return Object.keys(lib.characterPack[pack]);
			}

			const packCharactersId = this.getPackCharactersId(pack);
			switch (mode) {
				case '默认':
					return lib.characterSort[pack][packCategories];
				case '评级':
					return packCharactersId.filter(id => lib.rank.rarity[packCategories].includes(id));
				case '势力':
					return packCharactersId.filter(id => lib.character[id].group === packCategories || lib.character[id][1] === packCategories);
				case '性别':
					return packCharactersId.filter(id => lib.character[id].sex === packCategories || lib.character[id][0] === packCategories);
			}
		})()
		return characters;
	}
	/**
	 * 根据当前武将包id、模式和分类等过滤条件来获取要渲染的合法武将id数组，并去重排序
	 * @param { ((id: string) => boolean)? } filter
	 */
	getCharactersId(filter) {
		let characters = this.getCurrentCharactersId();
		characters = characters.filter(id => {
			if (id === void 0 || !this.getAllCharactersId().includes(id)) return false;
			if (filter && !filter(id)) return false;
			if (config.isCharSelectedActive && !lib.filter.characterDisabled(id) && !this.controller.selectedBannedList.includes(id)) return false;
			if (config.hide && window['AI禁将_savedFilter'](id)) return false;
			return true;
		});
		characters = [...new Set(characters)];
		return characters.sort((a, b) => {
			return !lib.filter.characterDisabled(b) - !lib.filter.characterDisabled(a) +
				!window['AI禁将_savedFilter'](b) - !window['AI禁将_savedFilter'](a)
		})
	}
}
