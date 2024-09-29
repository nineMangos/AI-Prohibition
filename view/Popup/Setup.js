import Popup from "./index.js";
import utils from "../../asset/utils.js";
import config from "../../asset/config.js";

export default class Setup extends Popup {
	constructor(parentNode) {
		super(parentNode, `
			/* 设置弹窗的文本区域设置布局 */
			.content{
				display: grid;
			    align-content: flex-start;
   				gap: 10px;
			}
			.content>div {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;
				transition: all.1s linear;
			}

			/*设置弹窗的按钮开启样式*/
			.content>div>span {
				display: block;
				background: url(${lib.assetURL}extension/AI禁将/image/button-off.png) no-repeat center center/contain;
				width: 60px;
				height: 21.6px;
				transform: scale(0.8);
				transform-origin: right center;
				cursor: pointer;
			}

			.content>div.hidden {
				opacity: 0;
				pointer-events: none;
				margin-top: -50px;
			}
			/*设置弹窗的按钮关闭样式*/
			.content>div>span.active {
				background: url(${lib.assetURL}extension/AI禁将/image/button-on.png) no-repeat center center/contain;
			}
		`);
		this.setCaption('AI禁将——设置');
		this.setContent(`                
			<div data-id="small"><h3>小型布局</h3><span></span></div>
			<div data-id="defaultImage"><h3>不加载武将原画（性能更好）</h3><span></span></div>
			<div data-id="remember"><h3>进入功能页时加载上次退出的页面</h3><span></span></div>
			<div data-id="addMenu"><h3>将此功能添加到游戏顶部菜单栏</h3><span></span></div>
			<div data-id="hide"><h3>隐藏不可选（默认禁用）的武将</h3><span></span></div>
			<div data-id="importData"><h3>导入禁将设置</h3></div>
			<div data-id="importDataSelect" class="hidden"><input style="width:75%" type="file" accept="*/*"><button style="padding:0 1vh;">确定</button></div>  
			<div data-id="exportData"><h3>导出禁将设置</h3></div>
			<div data-id="clear"><h3>一键清除禁将记录并恢复默认设置</h3></div>
			<div data-id="shoushaChars"><h3>仅启用手杀将池</h3></div>
		`);
		this.selector = parentNode;
		const content = this.node.content;
		this.node.content.node = {
			small: content.querySelector('div[data-id="small"'),
			defaultImage: content.querySelector('div[data-id="defaultImage"'),
			remember: content.querySelector('div[data-id="remember"'),
			addMenu: content.querySelector('div[data-id="addMenu"'),
			hide: content.querySelector('div[data-id="hide"'),
			importData: content.querySelector('div[data-id="importData"'),
			importDataSelect: content.querySelector('div[data-id="importDataSelect"'),
			exportData: content.querySelector('div[data-id="exportData"'),
			clear: content.querySelector('div[data-id="clear"'),
			shoushaChars: content.querySelector('div[data-id="shoushaChars"'),
		};
		this.#addListener();
	}
	#addListener() {
		const { small, defaultImage, remember, addMenu, hide, importData, importDataSelect, exportData, clear, shoushaChars } = this.node.content.node;
		this.autoToggleConfigBtn(small, () => this.selector.renderCharacterList());
		this.autoToggleConfigBtn(defaultImage);
		this.autoToggleConfigBtn(remember);
		this.autoToggleConfigBtn(addMenu);
		this.autoToggleConfigBtn(hide);

		const click = lib.config.touchscreen ? 'touchend' : 'click';
		importData.addEventListener(click, this.handleClickImportDataConfig.bind(this));
		importDataSelect.addEventListener(click, this.handleClickImportDataSelectConfig.bind(this));
		exportData.addEventListener(click, this.handleClickExportDataConfig.bind(this));
		clear.addEventListener(click, this.handleClickClearConfig.bind(this));
		shoushaChars.addEventListener(click, this.handleClickShoushaCharsConfig.bind(this));
	}
	autoToggleConfigBtn(node, callback) {
		const btn = node.querySelector('span');
		const name = node.getAttribute('data-id')
		if (config[name]) btn.classList.add('active');
		btn.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', (e) => {
			utils.playAudio('click1');
			const bool = btn.classList.toggle('active');
			config[name] = bool;
			config.save();
			if (callback) callback();
		});
	}
	handleClickImportDataConfig(e) {
		if (e) utils.playAudio('click2');
		e.target.closest('[data-id="importData"]').nextElementSibling.classList.toggle('hidden');
	}
	handleClickImportDataSelectConfig(e) {
		const btn = e.target;
		if (btn.tagName !== 'BUTTON') return;
		if (e) utils.playAudio('click2');
		const selector = this.selector;
		var fileToLoad = btn.previousSibling.files[0];
		if (fileToLoad) {
			var fileReader = new FileReader();
			fileReader.onload = function (fileLoadedEvent) {
				var data = fileLoadedEvent.target.result;
				if (!data) return;
				try {
					data = JSON.parse(lib.init.decode(data));
					if (!data || typeof data != 'object') {
						throw ('文件数据不是一个对象');
					}
					const keys = Object.keys(data);
					if (!keys.length || keys.some(key => !config.hasOwnProperty(key))) {
						throw ('导入数据识别不到，请检查文件是否正确');
					}
				}
				catch (e) {
					console.error(e);
					utils.alert('导入失败');
					return;
				}

				console.log('导入AI禁将设置：', data);
				config.save(data);

				utils.alert('导入成功');
				selector.reload();
			}
			fileReader.readAsText(fileToLoad, "UTF-8");
		}
	}
	handleClickExportDataConfig(e) {
		if (e) utils.playAudio('click2');
		const export_data = function (data) {
			game.export(lib.init.encode(JSON.stringify(data)), 'AI禁将 - 数据 - ' + (new Date()).toLocaleString());
		}
		export_data(config);
	}
	handleClickClearConfig(e) {
		if (e) utils.playAudio('click2');
		if (utils.confirm('确定要清除禁将记录并恢复默认设置吗？')) {
			config.saveDefault();
			utils.alert('清除成功！');
			this.selector.reload();
		}
	}
	handleClickShoushaCharsConfig(e) {
		if (e) utils.playAudio('click2');
		if (!utils.confirm("温馨提示：此功能提供的手杀将池仅作参考，有疏漏的地方请自行补充。手杀将池涉及的武将包有《标准》《界限突破》《神话再临》《一将成名》《璀璨星河》《星火燎原》《群英荟萃》《限定专属》《系列专属》《神将》《移动版》《始计篇》《谋攻篇》《外服武将》《怀旧》，若其中有未启用的武将包，建议先启用并且重启无名杀后，再触发此功能。点击“确定”以继续...")) return;
		const shoushaChars = ["old_re_lidian", "ganfuren", "caocao", "simayi", "xiahoudun", "zhangliao", "xuzhu", "guojia", "zhenji", "liubei", "guanyu", "zhangfei", "zhugeliang", "zhaoyun", "machao", "huangyueying", "sunquan", "ganning", "lvmeng", "huanggai", "zhouyu", "daqiao", "luxun", "sunshangxiang", "huatuo", "lvbu", "diaochan", "huaxiong", "gongsunzan", "xf_yiji", "re_xushu", "re_gongsunzan", "re_manchong", "re_wangyi", "re_caocao", "re_simayi", "re_guojia", "re_zhangliao", "re_xuzhu", "re_xiahoudun", "re_zhangfei", "re_zhaoyun", "re_guanyu", "re_machao", "re_zhouyu", "re_lvmeng", "re_ganning", "re_luxun", "re_daqiao", "re_huanggai", "re_lvbu", "re_huatuo", "re_liubei", "re_diaochan", "re_huangyueying", "re_sunquan", "re_sunshangxiang", "re_zhenji", "re_zhugeliang", "caoren", "zhoutai", "re_menghuo", "re_caopi", "re_huangzhong", "old_zhoutai", "old_caoren", "re_xuhuang", "re_pangde", "re_xiahouyuan", "re_weiyan", "sp_zhangjiao", "re_yuji", "sp_zhugeliang", "pangtong", "xunyu", "dianwei", "taishici", "yanwen", "re_yuanshao", "menghuo", "zhurong", "caopi", "re_lusu", "sunjian", "jiaxu", "jiangwei", "liushan", "zhanghe", "dengai", "sunce", "zhangzhang", "caiwenji", "wangji", "yanyan", "wangping", "luji", "sunliang", "xuyou", "yl_luzhi", "kuailiangkuaiyue", "haozhao", "lukang", "yl_yuanshu", "zhangxiu", "zhoufei", "xin_fazheng", "guanzhang", "wangyi", "caozhang", "guohuai", "zhangchunhua", "caozhi", "caochong", "xunyou", "xin_xushu", "xin_masu", "zhuran", "xusheng", "wuguotai", "lingtong", "yufan", "chengong", "bulianshi", "handang", "fuhuanghou", "zhonghui", "old_madai", "manchong", "chenqun", "sunluban", "guyong", "caifuren", "yj_jushou", "zhangsong", "zhuhuan", "xiahoushi", "panzhangmazhong", "zhoucang", "chengpu", "gaoshun", "caozhen", "wuyi", "hanhaoshihuan", "caorui", "caoxiu", "zhongyao", "liuchen", "zhangyi", "sunxiu", "zhuzhi", "quancong", "gongsunyuan", "guotufengji", "xin_liru", "guohuanghou", "liuyu", "liyan", "sundeng", "cenhun", "huanghao", "zhangrang", "sunziliufang", "xinxianying", "wuxian", "xushi", "caojie", "caiyong", "jikang", "qinmi", "xuezong", "sp_taishici", "re_jsp_pangtong", "lvdai", "re_zhangliang", "lvqian", "panjun", "duji", "zhoufang", "yanjun", "liuyao", "liuyan", "niujin", "hejin", "hansui", "caoying", "simahui", "yangxiu", "chenlin", "caohong", "sp_diaochan", "sp_zhaoyun", "liuxie", "zhugejin", "zhugeke", "simalang", "fuwan", "sp_sunshangxiang", "caoang", "zhangbao", "maliang", "sp_jiangwei", "sp_machao", "sunhao", "shixie", "mayunlu", "zhanglu", "sp_caiwenji", "zhugeguo", "lingju", "jsp_guanyu", "jsp_huangyueying", "zumao", "wenpin", "daxiaoqiao", "guansuo", "tadun", "yanbaihu", "chengyu", "sp_pangde", "sp_jiaxu", "litong", "mizhu", "buzhi", "caochun", "zhaoxiang", "mazhong", "dongyun", "yuejin", "hetaihou", "shamoke", "wangyun", "sunqian", "xizhicai", "quyi", "luzhi", "zangba", "re_kanze", "re_dongbai", "jiangfei", "liqueguosi", "lijue", "zhangji", "fanchou", "guosi", "zhanggong", "beimihu", "xurong", "zhangqiying", "sp_liuqi", "xugong", "shen_lusu", "shen_huatuo", "shen_sunce", "shen_xunyu", "shen_taishici", "shen_guojia", "shen_guanyu", "shen_zhaoyun", "shen_zhugeliang", "shen_lvmeng", "shen_zhouyu", "shen_simayi", "shen_caocao", "shen_lvbu", "shen_liubei", "shen_luxun", "shen_zhangliao", "shen_ganning", "tw_puyangxing", "chendong", "wanglang", "panfeng", "old_guanyinping", "old_guanzhang", "huangzhong", "old_dingfeng", "oldre_liubiao", "madai", "xuhuang", "fazheng", "ol_yuanshu", "pangde", "ol_huaxiong", "old_xiaoqiao", "weiyan", "xiahouyuan", "old_zhangxingcai", "yuji", "zhangjiao", "xin_yujin", "old_wangyi", "gz_mateng", "gz_kongrong", "gz_jiling", "gz_tianfeng", "gz_zoushi", "gz_zhangren"];
		shoushaChars.addArray(Object.keys({ ...lib.characterPack.mobile, ...lib.characterPack.sb, ...lib.characterPack.shiji }));
		config.bannedList = Object.keys(lib.characterPack).flatMap(i => Object.keys(lib.characterPack[i])).filter(i => !shoushaChars.includes(i));
		config.save();
		this.selector.renderCharacterList();
	}
}

customElements.define('selector-popup-setup', Setup);
