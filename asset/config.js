import { lib, game, ui, get, ai, _status } from "../../../noname.js";

class Config {
	static get #defaultConfig() {
		return {
			record: ['默认', 'all', 'all', 0, false],
			bannedList: [],
			defaultImage: false,
			addMenu: false,
			remember: true,
			small: false,
			hide: false,
			computedZoom: 1,
		}
	}

	/** * @type { '默认'|'评级'|'势力'|'性别' } 当前武将包的分类方式 */
	get currentActiveMode() { return this.remember ? this.record[0] : Config.#defaultConfig.record[0]; }
	set currentActiveMode(value) { this.record[0] = value; }
	/** * @type { string } 当前武将包（'all' 或 武将包id） */
	get currentActivePackId() { return this.remember ? this.record[1] : Config.#defaultConfig.record[1]; }
	set currentActivePackId(value) { this.record[1] = value; }
	/** * @type { string } 当前武将包的分类（‘standard_2008’、‘standard_2013’|'epic'、'legend'|'wei'、'shu'） */
	get currentActivePackCategoryId() { return this.remember ? this.record[2] : Config.#defaultConfig.record[2]; }
	set currentActivePackCategoryId(value) { this.record[2] = value; }
	/** * @type { number } 武将包栏的滚动条位置 */
	get scrollLeft() { return this.remember ? this.record[3] : Config.#defaultConfig.record[3]; }
	set scrollLeft(value) { this.record[3] = value; }
	/** * @type { boolean } 是否在显示“禁将列表” */
	get isCharSelectedActive() { return this.remember ? this.record[4] : Config.#defaultConfig.record[4]; }
	set isCharSelectedActive(value) { this.record[4] = value; }

	constructor() {
		game.saveExtensionConfigValue = game.saveExtensionConfigValue || function (extension, key) {
			return game.saveExtensionConfig(extension, key, game.getExtensionConfig(extension, key))
		};

		let config = game.getExtensionConfig('AI禁将', 'forbidai');
		if (config === void 0 || typeof config !== 'object') {
			game.saveExtensionConfig('AI禁将', 'forbidai', Config.#defaultConfig);
			config = game.getExtensionConfig('AI禁将', 'forbidai');
		}
		Object.setPrototypeOf(config, this);
		config.autoAddProperty();
		config.save();
		return config;
	}
	/**
	 * 保存配置
	 * @param { object? } value 配置
	 */
	save(value) {
		if (value) {
			Object.assign(this, value);
		}
		const defaultConfig = Config.#defaultConfig;
		Object.keys(this).forEach(key => {
			if (!defaultConfig.hasOwnProperty(key)) {
				delete this[key];
			}
		})
		this.autoAddProperty();
		game.saveExtensionConfigValue('AI禁将', 'forbidai');
	}
	/**
	 * 重置为默认配置
	 */
	saveDefault() {
		this.save(Config.#defaultConfig);
	}
	/**
	 * 自动补充配置项
	 */
	autoAddProperty() {
		const defaultConfig = Config.#defaultConfig;
		Object.keys(defaultConfig).forEach(key => {
			if (this[key] === void 0) {
				this[key] = defaultConfig[key];
			}
		})
	}
}

export default new Config();



