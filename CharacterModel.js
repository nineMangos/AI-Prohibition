import { lib, game, ui, get, ai, _status } from "../../noname.js";

class CharacterModel {
	#allCharactersId;
	#statusCharactersId;
	constructor(selector) {
		this.selector = selector;
	}
	/**
	 * 获取所有的武将包id数组，数组的首项加上 'all'，并将返回结果缓存在 this.#packlist 中
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
		const mode = this.selector.currentActiveMode;
		const pack = this.selector.currentActivePackId;
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
	 * 根据武将包id、模式和分类来获取武将id数组，并将返回结果保存在 this.#statusCharactersId 中
	 */
	getCharactersId() {
		const mode = this.selector.currentActiveMode;
		const pack = this.selector.currentActivePackId;
		const packCategories = this.selector.currentActivePackCategoryId;
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
		this.#statusCharactersId = [...new Set(characters.filter(id => id !== void 0 && this.getAllCharactersId().includes(id)))];
		return this.#statusCharactersId;
	}
	/**
	 * 获取 this.getCharactersId() 返回值的缓存角色数组
	 */
	getStatusCharactersId() {
		return this.#statusCharactersId || this.getCharactersId();
	}
	/**
	 * 获取过滤后的角色数组
	 * @param {function?} filter 过滤函数
	 */
	getFilterCharactersId(filter) {
		return this.getStatusCharactersId().filter(filter);
	}
}

export default CharacterModel;
