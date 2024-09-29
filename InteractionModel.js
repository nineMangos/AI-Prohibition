import { lib, game, ui, get, ai, _status } from "../../noname.js";
import CharacterSelector from "./CharacterSelector.js";
import Popup from "./Popup.js";

class InteractionModel {
	#timeId1;
	#timeId2;
	#timeId3;
	selectedBannedList = [];
	reducedBannedList = [];
	selector;
	awaitKeyup;
	/**
	 * @param { CharacterSelector } selector 武将选择器
	 */
	constructor(selector) {
		this.selector = selector;
	}
	onKeydownWindow(event) {
		const key = event.key.toLowerCase();
		if (!event.ctrlKey && !event.metaKey) {
			switch (key) {
				case 'f1': {
					this.onClickHelpBtn();
					break;
				}
				case 'escape':
				case 'esc': {
					this.onClickCloseBtn();
					break;
				}
			}
		} else {
			switch (key) {
				case 'a': {
					const target = this.selector.node.selectAll;
					this.onClickSelectAllBtn(target);
					break;
				}
				case 'f': {
					this.selector.node.searchInput.focus();
					break;
				}
				case 's': {
					this.onClickCharConfirmBtn();
					break;
				}
				case 'j': {
					const target = this.selector.node.charSelectedBtn;
					this.onClickCharSelectedBtn(target);
					break;
				}
				case 'h': {
					this.onClickHelpBtn();
					break;
				}
				case 't': {
					this.onClickSetUpBtn();
					break;
				}
				case 'b': {
					this.onClickInverseBtn();
					break;
				}
				case 'control': {
					if (this.awaitKeyup) return;
					this.awaitKeyup = true;
					const handleMousewheel = (e) => {
						if (!e.ctrlKey) return;
						var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
						let zoom = +getComputedStyle(document.documentElement).getPropertyValue('--sl-layout-zoom');
						const max = 1.95 / game.documentZoom, min = 0.53 / game.documentZoom;
						zoom = delta > 0 ? Math.min(max, zoom + 0.1) : Math.max(min, zoom - 0.1);
						document.documentElement.style.setProperty('--sl-layout-zoom', zoom);
					};
					const handleKeyup = (e) => {
						if (e.key.toLowerCase() !== 'control') return;
						this.awaitKeyup = false;
						window.removeEventListener('mousewheel', handleMousewheel);
						window.removeEventListener('keyup', handleKeyup);
					};
					window.addEventListener('mousewheel', handleMousewheel);
					window.addEventListener('keyup', handleKeyup);
					break;
				}
			}
		}
	}
	onClickSelectContentBtn(target, event) {
		if (event.target.tagName !== 'SPAN') return;
		this.playAudio('click1');
		const span = target.parentNode.querySelector('.method>span');
		if (this.selector.currentActiveMode === event.target.innerText) return;
		span.textContent = event.target.innerText;
		this.selector.currentActiveMode = event.target.innerText;
		this.selector.renderPackCategories();
	}
	onClickHelpBtn(target, event) {
		if (event) this.playAudio('click2');
		const popup = new Popup(true);
		popup.setCaption('AI禁将——帮助');
		popup.setContent(`
          <h3>一、简介</h3>
            <h4>此功能页旨在帮助玩家快速筛选武将，并将之移除或加入“禁将列表”。当玩家“确认禁将”后，在“禁将列表”里的武将<span class="firetext">不会在对局中被玩家或AI随机到，但玩家仍然可以通过“自由选将”功能选择到处于“禁将列表”里的武将。</span></h4>
          <br>
          <h3>二、按钮操作说明</h3>  
            <h4>1. “分类方式”下拉菜单：鼠标悬停或点击此菜单的黄色字部分，可以展开菜单并选择任一分类方式。</h4>
            <h4>2. “全（不）选”按钮：点击后，一键选择或取消选中当前页面展示的所有武将（“锁链”出现或消失）。</h4>
            <h4>3. “反选”按钮：当前页面展示的所有武将会切换选中状态。</h4>
            <h4>4. “齿轮”图标按钮：点击打开设置页。</h4>
            <h4>5. “搜索输入框”：输入武将的名称/拼音后，点击“Enter”键或“放大镜”图标搜索基于当前页面的武将。</h4>
            <h4>6. “返回”图标按钮：退出功能页。</h4> 
			<h4>7. “左/右箭头”按钮：点击此按钮，所有的武将包按钮向左/向右移动一次。长按此按钮会持续触发。</h4>
			<h4>8. “武将包”按钮：点击后，会根据当前分类方式、武将包、武将包分类展示对应的武将。</h4>
			<h4>9. “武将包分类”按钮：点击后，会根据当前分类方式、武将包、武将包分类展示对应的武将。</h4>
			<h4>10. “禁将列表”按钮：点击后，展示或取消展示当前页面的所有处于被选中或被加入“小黑屋”武将。</h4>
			<h4>11. “确认禁将”按钮：点击后，将所有被选中的武将（包括其他页面的）加入“小黑屋”，被加入“小黑屋”才是不能被随机到的武将。</h4>
			<h4>12. “武将”按钮：点击后，该武将会切换自身的选中状态（“锁链”出现或消失）。</h4>
			<h4>13. “半透明武将”按钮：不可点击，不可选中，这是本体或其他扩展的默认禁用武将，故不对其的禁用状态进行更改，仅作展示用。</h4>
          <br>
          <h3>三、键盘和鼠标操作说明</h3>
            <h4>1. “F1”或“Ctrl + H”：触发“帮助”按钮。</h4>
			<h4>2. “Ctrl + A”：触发“全（不）选”按钮。</h4>
			<h4>3. “Ctrl + B”：触发“反选”按钮。</h4>
			<h4>4. “Ctrl + J”：触发“禁将列表”按钮。</h4>
			<h4>5. “Ctrl + S”：触发“确认禁将”按钮。</h4>
			<h4>6. “Ctrl + F”：“搜索输入框”聚焦。</h4>
			<h4>7. “Ctrl + T”：触发“齿轮”图标按钮。</h4>
			<h4>8. “Ctrl + 鼠标滚轮”：对功能页进行缩放。</h4>
			<h4>9. “Esc”：触发“返回”图标按钮。</h4>
			<h4>10. 框选操作：鼠标在“武将按钮”旁边的进行拖动，松开鼠标后会选中处于框内的“武将按钮”。</h4>
			<h4>11. “Ctrl + 框选操作”：取消处于框内“武将按钮”的选中状态。</h4>
			<h4>12. “Shift + 框选操作”：取消本次框选。</h4>
          <br>
          <h3>四、其他</h3>
            <h4>1.鸣谢：感谢“缘伴随行”提供的 game.oncePlayAudio 函数。</h4>
            <h4>2.bug反馈：请联系本人QQ 1036059377。</h4>
          <br>
           `);
	}
	onClickSelectAllBtn(target, event) {
		if (event) this.playAudio('click2');
		if (target.classList.toggle('active')) {
			target.textContent = '全不选';
			this.selector.buttonsArr.forEach(btn => {
				this.hanldleCharBtnSelect(btn);
			});
		} else {
			target.textContent = '全选';
			this.selector.buttonsArr.forEach(btn => {
				this.hanldleCharBtnUnselect(btn);
			});
		}
	}
	autoToggleSelectAllBtn() {
		if (this.#timeId3) clearTimeout(this.#timeId3);
		const { selectAll } = this.selector.node;
		this.#timeId3 = setTimeout(() => {
			this.#timeId3 = null;
			if (this.selector.buttonsArr.every(btn => btn.getSelected())) {
				if (!selectAll.classList.contains('active')) {
					selectAll.classList.add('active');
					selectAll.textContent = '全不选';
				}
			} else {
				if (selectAll.classList.contains('active')) {
					selectAll.classList.remove('active');
					selectAll.textContent = '全选';
				}
			}
		}, 30);
	}
	onClickInverseBtn(target, event) {
		if (event) this.playAudio('click2');
		this.selector.buttonsArr.forEach(btn => {
			this.hanldleCharBtnToggleSelect(btn);
		});
	}
	onClickSetUpBtn(target, event) {
		if (event) this.playAudio('click2');
		const popup = new Popup(true);
		popup.setCaption('AI禁将——设置');
		popup.setContent(`                
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
		const { small, defaultImage, remember, addMenu, hide, importData, importDataSelect, exportData, clear, shoushaChars } = popup.getConfigElements();
		this.autoToggleConfigBtn(small, () => this.selector.renderCharacterList());
		this.autoToggleConfigBtn(defaultImage)
		this.autoToggleConfigBtn(remember)
		this.autoToggleConfigBtn(addMenu)
		this.autoToggleConfigBtn(hide)

		const click = lib.config.touchscreen ? 'touchend' : 'click';
		importData.addEventListener(click, this.handleClickImportDataConfig.bind(this));
		importDataSelect.addEventListener(click, this.handleClickImportDataSelectConfig.bind(this));
		exportData.addEventListener(click, this.handleClickExportDataConfig.bind(this));
		clear.addEventListener(click, this.handleClickClearConfig.bind(this));
		shoushaChars.addEventListener(click, this.handleClickShoushaCharsConfig.bind(this));
	}
	onKeyupSearchInput(target, event) {
		event.stopPropagation();
		if (event.key == 'Enter') {
			this.search();
		}
	}
	onClickSearchBtn(target, event) {
		this.search();
	}
	search() {
		const selector = this.selector;
		const value = selector.node.searchInput.value;
		if (value.trim() === "") {
			if (selector.isSearching) {
				selector.isSearching = false;
				selector.renderCharacterList();
			} else {
				game.alert("请输入正确内容");
			}
			return;
		}
		if (value.length > 20) return game.alert("输入内容过长");
		const reg = new RegExp(value);
		const result = selector.characterModel.getFilterCharactersId(c => reg.test(c) || reg.test(lib.translate[c]));
		if (result.length === 0) return game.alert("没有找到相关的武将");
		else {
			selector.isSearching = true;
			selector.renderCharacterList(result);
		}
	};
	onClickCloseBtn(target, event) {
		if (event) this.playAudio('click5');
		this.selector.scrollLeft = this.selector.node.charPackList.scrollLeft;
		game.saveExtensionConfigValue('AI禁将', 'forbidai');
		this.selector.close();
	}
	onMousedownDirectionBtn(target, event) {
		this.playAudio('click2');
		const change = target.classList.contains('selector-list-left') ? -200 : 200;
		const ul = target.parentNode.querySelector('ul');
		ul.scroll({ left: ul.scrollLeft + change, behavior: 'smooth' });
		this.#timeId2 = setTimeout(() => this.#timeId1 = setInterval(() => ul.scrollLeft += change / 2, 100), 300);
	}
	onWheelCharPackList(target, event) {
		event.preventDefault();
		target.scrollLeft += event.deltaY / 2;
	}
	onClickList(target, event) {
		if (event) this.playAudio('click3');
		const li = event.target.closest('li');
		if (!li) return;
		const selector = this.selector;
		const activeLi = target.querySelector('li.active');
		if (li === activeLi && !selector.isSearching) {
			return;
		};
		if (activeLi) {
			activeLi.classList.remove('active');
		}
		//给当前点击的 li 添加 active 类名
		li.classList.add('active');
		const id = li.getAttribute('data-id');
		target.tagName === 'UL' ? selector.currentActivePackId = id : selector.currentActivePackCategoryId = id;
		target.tagName === 'UL' ? selector.renderPackCategories() : selector.renderCharacterList();
		selector.isSearching = false;
	}
	onMouseupSelector(target, event) {
		clearInterval(this.#timeId1);
		clearTimeout(this.#timeId2);
	}
	onClickCharSelectedBtn(target, event) {
		if (event) this.playAudio('click2');
		if (target.classList.toggle('active')) {
			this.selector.isCharSelectedActive = true
			this.selector.renderCharacterList()
		} else {
			this.selector.isCharSelectedActive = false
			this.selector.renderCharacterList()
		}
	}
	onClickCharConfirmBtn(target, event) {
		if (event) this.playAudio('click2');
		const allBannedList1 = Object.keys(lib.character).filter(id => lib.filter.characterDisabled(id) && !window.forbidai_savedFilter(id));// 1.当前禁将
		const allBannedList2 = [...new Set([...this.selectedBannedList, ...allBannedList1])];// 2.当前禁将 + 已选禁将
		const allBannedList3 = allBannedList2.filter(id => !this.reducedBannedList.includes(id));// 3.过滤掉2的已移除禁将和系统禁将
		this.selectedBannedList.splice(0, this.selectedBannedList.length);
		this.reducedBannedList.splice(0, this.reducedBannedList.length);

		const config = this.selector.config;
		config.bannedList = allBannedList3;
		game.saveExtensionConfigValue('AI禁将', 'forbidai');
		const mobile = window.cordova || lib.config.touchscreen;
		const enter = mobile ? '\n\n' : '<br><br>';
		const str = `本次禁用武将 ${allBannedList3.length - allBannedList1.length} 个${enter}自选禁用武将 ${allBannedList3.length} 个${enter}总计禁用武将 ${Object.keys(lib.character).filter(id => lib.filter.characterDisabled(id)).length} 个`;
		mobile ? alert(str) : game.alert(str);
		this.selector.buttonsArr.forEach(btn => btn.autoblock());
	}
	onMousedownCharacterList(target, event) {
		//不是左键点击直接返回
		if (event.button !== 0) return;
		const button = event.target.closest('.button.item');
		if (!button) {
			const content = target.querySelector('.content-container>.content');
			if (!content || event.target === content) return;
			this.selector.canvas.hanldleMouseDown(content, event);
		} else {
			target.addEventListener("mouseup", e => {
				if (e.target.closest('.button.item') === button) {
					if (event) {
						this.playAudio(button.getSelected() ? 'click6' : 'click4');
					}
					this.hanldleCharBtnToggleSelect(button);
				}
			}, { once: true });
		}
	}
	hanldleCharBtnSelect(btn) {
		btn.select();
		this.selectedBannedList.add(btn.name);
		this.reducedBannedList.remove(btn.name);
		this.autoToggleSelectAllBtn();
	}
	hanldleCharBtnUnselect(btn) {
		btn.unselect();
		this.selectedBannedList.remove(btn.name);
		this.reducedBannedList.add(btn.name);
		this.autoToggleSelectAllBtn();
	}
	hanldleCharBtnToggleSelect(btn) {
		if (btn.getSelected()) {
			this.hanldleCharBtnUnselect(btn);
		} else {
			this.hanldleCharBtnSelect(btn);
		}
	}
	autoToggleConfigBtn(node, callback) {
		const selector = this.selector, config = selector.config;
		const btn = node.querySelector('span');
		const name = node.getAttribute('data-id')
		if (config[name]) btn.classList.add('active');
		btn.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', () => {
			this.playAudio('click1');
			const bool = btn.classList.toggle('active');
			config[name] = bool;
			game.saveExtensionConfigValue('AI禁将', 'forbidai');
			if (callback) callback();
		});
	}
	handleClickImportDataConfig(e) {
		if (e) this.playAudio('click2');
		e.target.closest('[data-id="importData"]').nextElementSibling.classList.toggle('hidden');
	}
	handleClickImportDataSelectConfig(e) {
		const btn = e.target;
		if (btn.tagName !== 'BUTTON') return;
		if (e) this.playAudio('click2');
		const selector = this.selector, config = selector.config;
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
					if (!['record', 'bannedList', 'defaultImage', 'addMenu', 'remember', 'small', 'hide'].some(i => Object.keys(data).includes(i))) {
						throw ('文件数据不足');
					}
					console.log(data);
				}
				catch (e) {
					console.error(e);
					alert('导入失败');
					return;
				}

				config.record = data.record || ['默认', 'all', 'all', 0, false];
				config.bannedList = data.bannedList || [];
				config.defaultImage = data.defaultImage || false;
				config.addMenu = data.addMenu || false;
				config.remember = data.remember || true;
				config.small = data.small || false;
				config.hide = data.hide || false;
				game.saveExtensionConfigValue('AI禁将', 'forbidai');

				alert('导入成功');
				selector.reinit();
			}
			fileReader.readAsText(fileToLoad, "UTF-8");
		}
	}
	handleClickExportDataConfig(e) {
		if (e) this.playAudio('click2');
		const selector = this.selector, config = selector.config;
		let export_data = function (data) {
			game.export(lib.init.encode(JSON.stringify(data)), 'AI禁将 - 数据 - ' + (new Date()).toLocaleString());
		}
		export_data({
			record: config.record,
			bannedList: config.bannedList,
			defaultImage: config.defaultImage,
			addMenu: config.addMenu,
			remember: config.remember,
			small: config.small,
			hide: config.hide,
		});
	}
	handleClickClearConfig(e) {
		if (e) this.playAudio('click2');
		const selector = this.selector, config = selector.config;
		if (window.confirm('确定要清除禁将记录并恢复默认设置吗？')) {
			config.record = ['默认', 'all', 'all', 0, false];
			config.bannedList = [];
			config.defaultImage = false;
			config.addMenu = false;
			config.remember = true;
			config.small = false;
			config.hide = false;
			game.saveExtensionConfigValue('AI禁将', 'forbidai');
			alert('清除成功！');
			this.selector.reinit();
		}
	}
	handleClickShoushaCharsConfig(e) {
		if (e) this.playAudio('click2');
		if (!confirm("温馨提示：此功能提供的手杀将池仅作参考，有疏漏的地方请自行补充。手杀将池涉及的武将包有《标准》《界限突破》《神话再临》《一将成名》《璀璨星河》《星火燎原》《群英荟萃》《限定专属》《系列专属》《神将》《移动版》《始计篇》《谋攻篇》《外服武将》《怀旧》，若其中有未启用的武将包，建议先启用并且重启无名杀后，再触发此功能。点击“确定”以继续...")) return;
		const shoushaChars = ["old_re_lidian", "ganfuren", "caocao", "simayi", "xiahoudun", "zhangliao", "xuzhu", "guojia", "zhenji", "liubei", "guanyu", "zhangfei", "zhugeliang", "zhaoyun", "machao", "huangyueying", "sunquan", "ganning", "lvmeng", "huanggai", "zhouyu", "daqiao", "luxun", "sunshangxiang", "huatuo", "lvbu", "diaochan", "huaxiong", "gongsunzan", "xf_yiji", "re_xushu", "re_gongsunzan", "re_manchong", "re_wangyi", "re_caocao", "re_simayi", "re_guojia", "re_zhangliao", "re_xuzhu", "re_xiahoudun", "re_zhangfei", "re_zhaoyun", "re_guanyu", "re_machao", "re_zhouyu", "re_lvmeng", "re_ganning", "re_luxun", "re_daqiao", "re_huanggai", "re_lvbu", "re_huatuo", "re_liubei", "re_diaochan", "re_huangyueying", "re_sunquan", "re_sunshangxiang", "re_zhenji", "re_zhugeliang", "caoren", "zhoutai", "re_menghuo", "re_caopi", "re_huangzhong", "old_zhoutai", "old_caoren", "re_xuhuang", "re_pangde", "re_xiahouyuan", "re_weiyan", "sp_zhangjiao", "re_yuji", "sp_zhugeliang", "pangtong", "xunyu", "dianwei", "taishici", "yanwen", "re_yuanshao", "menghuo", "zhurong", "caopi", "re_lusu", "sunjian", "jiaxu", "jiangwei", "liushan", "zhanghe", "dengai", "sunce", "zhangzhang", "caiwenji", "wangji", "yanyan", "wangping", "luji", "sunliang", "xuyou", "yl_luzhi", "kuailiangkuaiyue", "haozhao", "lukang", "yl_yuanshu", "zhangxiu", "zhoufei", "xin_fazheng", "guanzhang", "wangyi", "caozhang", "guohuai", "zhangchunhua", "caozhi", "caochong", "xunyou", "xin_xushu", "xin_masu", "zhuran", "xusheng", "wuguotai", "lingtong", "yufan", "chengong", "bulianshi", "handang", "fuhuanghou", "zhonghui", "old_madai", "manchong", "chenqun", "sunluban", "guyong", "caifuren", "yj_jushou", "zhangsong", "zhuhuan", "xiahoushi", "panzhangmazhong", "zhoucang", "chengpu", "gaoshun", "caozhen", "wuyi", "hanhaoshihuan", "caorui", "caoxiu", "zhongyao", "liuchen", "zhangyi", "sunxiu", "zhuzhi", "quancong", "gongsunyuan", "guotufengji", "xin_liru", "guohuanghou", "liuyu", "liyan", "sundeng", "cenhun", "huanghao", "zhangrang", "sunziliufang", "xinxianying", "wuxian", "xushi", "caojie", "caiyong", "jikang", "qinmi", "xuezong", "sp_taishici", "re_jsp_pangtong", "lvdai", "re_zhangliang", "lvqian", "panjun", "duji", "zhoufang", "yanjun", "liuyao", "liuyan", "niujin", "hejin", "hansui", "caoying", "simahui", "yangxiu", "chenlin", "caohong", "sp_diaochan", "sp_zhaoyun", "liuxie", "zhugejin", "zhugeke", "simalang", "fuwan", "sp_sunshangxiang", "caoang", "zhangbao", "maliang", "sp_jiangwei", "sp_machao", "sunhao", "shixie", "mayunlu", "zhanglu", "sp_caiwenji", "zhugeguo", "lingju", "jsp_guanyu", "jsp_huangyueying", "zumao", "wenpin", "daxiaoqiao", "guansuo", "tadun", "yanbaihu", "chengyu", "sp_pangde", "sp_jiaxu", "litong", "mizhu", "buzhi", "caochun", "zhaoxiang", "mazhong", "dongyun", "yuejin", "hetaihou", "shamoke", "wangyun", "sunqian", "xizhicai", "quyi", "luzhi", "zangba", "re_kanze", "re_dongbai", "jiangfei", "liqueguosi", "lijue", "zhangji", "fanchou", "guosi", "zhanggong", "beimihu", "xurong", "zhangqiying", "sp_liuqi", "xugong", "shen_lusu", "shen_huatuo", "shen_sunce", "shen_xunyu", "shen_taishici", "shen_guojia", "shen_guanyu", "shen_zhaoyun", "shen_zhugeliang", "shen_lvmeng", "shen_zhouyu", "shen_simayi", "shen_caocao", "shen_lvbu", "shen_liubei", "shen_luxun", "shen_zhangliao", "shen_ganning", "tw_puyangxing", "chendong", "wanglang", "panfeng", "old_guanyinping", "old_guanzhang", "huangzhong", "old_dingfeng", "oldre_liubiao", "madai", "xuhuang", "fazheng", "ol_yuanshu", "pangde", "ol_huaxiong", "old_xiaoqiao", "weiyan", "xiahouyuan", "old_zhangxingcai", "yuji", "zhangjiao", "xin_yujin", "old_wangyi", "gz_mateng", "gz_kongrong", "gz_jiling", "gz_tianfeng", "gz_zoushi", "gz_zhangren"];
		shoushaChars.addArray(Object.keys(lib.characterPack.mobile));
		shoushaChars.addArray(Object.keys(lib.characterPack.sb));
		shoushaChars.addArray(Object.keys(lib.characterPack.shiji));
		this.selector.config.bannedList = Object.keys(lib.characterPack).flatMap(i => Object.keys(lib.characterPack[i])).filter(i => !shoushaChars.includes(i));
		game.saveExtensionConfigValue('AI禁将', 'forbidai');
		this.selector.reinit();
	}
	//搬运自缘伴随行的《启动页美化》，已征得同意
	playAudio(name, volume) {
		const audio = document.createElement("audio");
		const path = "extension/AI禁将/audio/";
		audio.src = lib.assetURL + path + name.replace(".mp3", "") + ".mp3";
		audio.volume = volume || lib.config.volumn_audio / 8;
		document.body.appendChild(audio);
		audio.addEventListener("ended", () => {
			document.body.removeChild(audio);
		});
		audio.play()["catch"]((error) => {
			alert("⚠️音频播放时发生错误！\n⚠️请检查你的音频文件【" + lib.assetURL + path + name + "】是否正确存在！");
			console.error("⚠️音频播放时发生错误！\n⚠️请检查你的音频文件【" + lib.assetURL + path + name + "】是否正确存在！");
			audio.remove();
		});
	}
}

export default InteractionModel;
