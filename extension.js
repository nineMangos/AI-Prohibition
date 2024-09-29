game.import("extension", function (lib, game, ui, get, ai, _status) {

  const forbidaiShow = function () {
    if (!game.getExtensionConfig('AI禁将', 'enable')) {
      alert('请先启用AI禁将扩展');
      return;
    }

    const CONFIG = game.getExtensionConfig('AI禁将', 'forbidai');
    const savedFilter = window.forbidai_savedFilter;
    const selectedBannedList = [];
    const reducedBannedList = [];

    let MODE = '默认'; // 分类方式
    let ACTIVE1 = 'all'; // 选中的武将包按钮
    let ACTIVE2 = 'all'; // 选中的武将包分类按钮
    let SCROLL = 0; // 武将包横向滚动位置
    let FORBIDAI = false;  //是否开启“禁将列表”按钮

    let SEARCHING = false; // 是否正在搜索
    let CONTAINER;// 定义容器

    function load(reload) {
      if (reload && Array.from(ui.window.childNodes).includes(CONTAINER)) ui.window.removeChild(CONTAINER);
      CONTAINER = ui.create.div('.PSdiv#PSforbidai-container');
      const record = CONFIG.record;
      if (CONFIG.remember && record && record.length) {
        try {
          MODE = record[0];
          ACTIVE1 = record[1];
          ACTIVE2 = record[2];
          SCROLL = record[3];
          FORBIDAI = record[4];
          init();
        } catch (e) {
          console.log(e);
          console.log('加载出错，恢复默认设置重新加载');
          reinit();
        }
      } else {
        reinit();
      }
    }
    load();

    function reinit() {
      if (Array.from(ui.window.childNodes).includes(CONTAINER)) ui.window.removeChild(CONTAINER);
      CONTAINER.innerHTML = '';
      MODE = '默认';
      ACTIVE1 = 'all';
      ACTIVE2 = 'all';
      SCROLL = 0;
      FORBIDAI = false;
      init();
    }

    /* 初始化函数 */
    function init() {
      ui.window.appendChild(CONTAINER);
      /* 整体容器赋值HTML结构 */
      CONTAINER.innerHTML = `
          <div class="PSdiv PSheader">
          <div class="PSdiv PShelp"></div>
          <div class="PSdiv PSpack">
            <div class="PSdiv PSselectAll">
              全选
            </div>
            <div class="PSdiv PSsetUp"></div>
            <div class="PSdiv PSselect">
              分类方式：<span style="color: #ffe6b7;">默认</span><img src="${lib.assetURL}extension/AI禁将/image/T3.png">
              <div class="PSdiv PSselect-content">
                <div class="PSdiv">
                  <span>默认</span>
                  <span>评级</span>
                  <span>势力</span>
                  <span>性别</span>
                </div>
              </div>
            </div>
          </div>
          <div class="PSdiv PSsearch">
            <input type="text" class="PSinput" placeholder="输入武将名称/拼音以搜索">
            <div class="PSdiv PSbutton"></div>
          </div>
          <div class="PSdiv PSloginfo">
            共搜索到<span style="color: #ffe6b7;">0</span>个武将
          </div>
          <div class="PSdiv PSclose"></div>
        </div>
        <div class="PSdiv PSlist">
          <div class="PSdiv PSleft"></div>
          <div class="PSdiv PSright"></div>
          <ul></ul>
        </div>
        <div class="PSdiv PScontent">
          <div class="PSdiv PScharacterSort">
            <ol></ol>
            <div class="PSdiv PSresult">
              <div class="PSdiv PSforbiden">禁将列表</div>
              <div class="PSdiv PSconfirm">确认禁将</div>
            </div>
          </div>
        </div>
        `;
      const forbidai_bg = game.getExtensionConfig('AI禁将', 'forbidai_bg');
      if (forbidai_bg === 'shadow') {
        CONTAINER.style.backgroundImage = ui.background.style.backgroundImage;
      }
      /* 头部区域-帮助按钮添加点击事件 */
      let help = document.querySelector('#PSforbidai-container .PSheader .PShelp');
      help.addEventListener('click', function () {
        let popupContainer = ui.create.div('#popupContainer', '<div class="PSdiv"><h2>AI禁将——帮助</h2><span></span></div>', CONTAINER);
        let popupClose = popupContainer.querySelector('span');
        popupClose.addEventListener('click', function () {
          CONTAINER.removeChild(this.parentNode.parentNode);
        });
        let popup = ui.create.div('.PSdiv', popupContainer.firstElementChild);
        popup.innerHTML = `             
          <h3>一、简介</h3>
            <h4>此功能可以帮助玩家快速筛选武将，并将其加入禁将列表，禁将列表里的武将不会在对局中被AI选择到（仅点将可选）。</h4>
          <br>
          <h3>二、使用说明</h3>  
            <h4>1. 点击“分类方式”下拉菜单，选择任意一种分类方式。</h4>
            <h4>2. 点击任意一个“武将包”按钮，选择武将包。</h4>
            <h4>3. 点击任意一个“武将包分类”按钮，选择该武将包的分类。</h4>
            <h4>4. 点击“搜索框”，输入武将名称/拼音，搜索武将。</h4>
            <h4>5. 选中页面出现的任意个“武将”，将要加入“禁将列表”的武将，其武将牌会出现“链锁”提示；反之，将要从“禁将列表”移除的武将，其武将牌的“链锁”提示消失。</h4>
            <h4>6. 点击“确认禁将”按钮，所有有“链锁”的武将正式加入“禁将列表”（武将牌变暗）；所有没有“链锁”的武将正式从“禁将列表”中移除（武将牌变亮）。</h4> 
          <br>
          <h3>三、其他说明</h3>
            <h4>1. “全选”按钮：点击此按钮，当前页面的所有武将都会出现“链锁”提示；再次点击此按钮，当前页面的所有武将的“链锁”提示消失。</h4>
            <h4>2. “禁将列表”按钮：点击此按钮，会展示当前页面将要加入/已被加入“禁将列表”的武将。</h4>
            <h4>3. “左/右箭头”按钮：点击此按钮，所有的武将包按钮向左/向右移动一格。长按此按钮会持续移动。</h4>
            <h4>4. “齿轮”按钮：点击此按钮，打开设置页。</h4>
            <h4>5. “半透明的武将”：不可点击，默认已加入“禁将列表”——为了兼容本体/其他扩展的的禁将，如果一些武将已被本体/其他扩展加入了禁将，则无法编辑这些角色的禁将状态（例如我用“搬运自用”的禁将功能将部分武将设置为AI禁用，这些武将在这里会变成“半透明状态”）。</h4>
          <br>
          <h3>四、关于</h3>
            <h4>如需反馈bug请联系本人qq1036059377。</h4>
          <br>
           `;
      })

      /* 头部区域-齿轮按钮添加点击事件 */
      let setUp = document.querySelector('#PSforbidai-container .PSheader .PSsetUp');
      setUp.addEventListener('click', function () {
        let popupContainer = ui.create.div('#popupContainer', '<div class="PSdiv"><h2>AI禁将——设置</h2><span></span></div>', CONTAINER);
        let popupClose = popupContainer.querySelector('span');
        popupClose.addEventListener('click', function () {
          CONTAINER.removeChild(this.parentNode.parentNode);
        });
        let popup = ui.create.div('.PSdiv', popupContainer.firstElementChild);
        popup.innerHTML = `                
          <div class="PSdiv" data-id="small"><h3>小型布局</h3><span></span></div>  
          <div class="PSdiv" data-id="defaultImage"><h3>不加载武将原画（性能更好）</h3><span></span></div>  
          <div class="PSdiv" data-id="remember"><h3>进入功能页时加载上次退出的页面</h3><span></span></div>
          <div class="PSdiv" data-id="addMenu"><h3>将此功能添加到游戏顶部菜单栏</h3><span></span></div>
          <div class="PSdiv" data-id="hide"><h3>隐藏不可选（默认禁用）的武将</h3><span></span></div>
          <div class="PSdiv"><h3>导入禁将设置</h3></div>    
          <div class="PSdiv PShidden" data-id="import" style="height:4.5vh; width:100%; font-size:1.7vh;"><input style="width:75%" type="file" accept="*/*"><button style="padding:0 1vh;">确定</button></div>  
          <div class="PSdiv" data-id="export"><h3>导出禁将设置</h3></div>  
          <div class="PSdiv" data-id="clear"><h3>一键清除禁将记录并恢复默认设置</h3></div>  
          `;

        /**
         * 设置小布局
         */
        let config0 = popup.querySelector('.PSdiv[data-id="small"] span');
        if (CONFIG.small) config0.classList.add('active');
        config0.addEventListener('click', function () {
          if (this.classList.toggle('active')) {
            CONFIG.small = true;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
            renderCharacterList();
          } else {
            CONFIG.small = false;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
            renderCharacterList();
          }
        });

        /**
         * 设置不加载武将原画
         */
        let config1 = popup.querySelector('.PSdiv[data-id="defaultImage"] span');
        if (CONFIG.defaultImage) config1.classList.add('active');
        config1.addEventListener('click', function () {
          if (this.classList.toggle('active')) {
            CONFIG.defaultImage = true;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
          } else {
            CONFIG.defaultImage = false;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
          }
        });

        /**
         * 设置加载上次退出的页面
         */
        let config2 = popup.querySelector('.PSdiv[data-id="remember"] span');
        if (CONFIG.remember) config2.classList.add('active');
        config2.addEventListener('click', function () {
          if (this.classList.toggle('active')) {
            CONFIG.remember = true;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
          } else {
            CONFIG.remember = false;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
          }
        });

        /**
         * 设置添加到游戏顶部菜单栏
         */
        let config3 = popup.querySelector('.PSdiv[data-id="addMenu"] span');
        if (CONFIG.addMenu) config3.classList.add('active');
        config3.addEventListener('click', function () {
          if (this.classList.toggle('active')) {
            CONFIG.addMenu = true;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
          } else {
            CONFIG.addMenu = false;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
          }
        });

        /**
         * 设置隐藏不可选的武将 
         */
        let config4 = popup.querySelector('.PSdiv[data-id="hide"] span');
        if (CONFIG.hide) config4.classList.add('active');
        config4.addEventListener('click', function () {
          if (this.classList.toggle('active')) {
            CONFIG.hide = true;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
            renderCharacterList();
          } else {
            CONFIG.hide = false;
            game.saveExtensionConfigValue('AI禁将', 'forbidai');
            renderCharacterList();
          }
        });

        /**
         * 设置导入禁将设置
         */
        let config5 = popup.querySelector('.PSdiv[data-id="import"] button');
        config5.addEventListener('click', function () {
          var fileToLoad = this.previousSibling.files[0];
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
                if (!['bannedList', 'defaultImage', 'addMenu', 'remember', 'record', 'small', 'hide'].some(i => Object.keys(data).includes(i))) {
                  throw ('文件数据不足');
                }
                console.log(data);
              }
              catch (e) {
                console.log(e);
                alert('导入失败');
                return;
              }

              {
                CONFIG.record = data.record || [];
                CONFIG.bannedList = data.bannedList || [];
                CONFIG.defaultImage = data.defaultImage || false;
                CONFIG.addMenu = data.addMenu || false;
                CONFIG.remember = data.remember || true;
                CONFIG.small = data.small || false;
                CONFIG.hide = data.hide || false;
                game.saveExtensionConfigValue('AI禁将', 'forbidai');
              }
              alert('导入成功');

              load(true);
            }
            fileReader.readAsText(fileToLoad, "UTF-8");
          }
        });
        config5.parentNode.previousElementSibling.addEventListener('click', function () {
          config5.parentNode.classList.toggle('PShidden');
        });


        /**
         * 设置导出禁将设置
         */
        let config6 = popup.querySelector('.PSdiv[data-id="export"]');
        config6.addEventListener('click', function () {
          let export_data = function (data) {
            game.export(lib.init.encode(JSON.stringify(data)), 'AI禁将 - 数据 - ' + (new Date()).toLocaleString());
          }
          export_data({
            record: [MODE, ACTIVE1, ACTIVE2, SCROLL, FORBIDAI],
            bannedList: CONFIG.bannedList,
            defaultImage: CONFIG.defaultImage,
            addMenu: CONFIG.addMenu,
            remember: CONFIG.remember,
            small: CONFIG.small,
            hide: CONFIG.hide,
          });
        });


        /**
        * 设置一键清除记录
        */
        let config7 = popup.querySelector('.PSdiv[data-id="clear"]');
        config7.addEventListener('click', function () {
          if (window.confirm('确定要清除禁将记录并恢复默认设置吗？')) {
            {
              CONFIG.record = [];
              CONFIG.bannedList = [];
              CONFIG.defaultImage = false;
              CONFIG.addMenu = false;
              CONFIG.remember = true;
              CONFIG.small = false;
              CONFIG.hide = false;
              game.saveExtensionConfigValue('AI禁将', 'forbidai');
            }
            alert('清除成功！');
            load(true);
          }
        });
      })

      /* 头部区域-全选按钮添加点击事件 */
      let selectAll = document.querySelector('#PSforbidai-container .PSheader .PSselectAll');
      selectAll.addEventListener('click', function (e) {
        let items = document.querySelectorAll('#PSforbidai-container .PScharacterList .PSitem');
        if (this.classList.toggle('active')) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].style.opacity === '0.5') continue;
            if (!items[i].lastChild.classList.contains('PStip')) {
              let child = ui.create.div('.PSdiv .PStip');
              items[i].appendChild(child);
              selectedBannedList.push(items[i].dataset.name);
              reducedBannedList.remove(items[i].dataset.name);
            }
          }
        } else {
          for (let i = 0; i < items.length; i++) {
            if (items[i].style.opacity === '0.5') continue;
            if (items[i].lastChild.classList.contains('PStip')) {
              items[i].removeChild(items[i].lastChild);
              selectedBannedList.remove(items[i].dataset.name);
              reducedBannedList.push(items[i].dataset.name);
            }
          }
        }
      });

      /* 头部区域-分类方式切换按钮添加点击事件 */
      let selectButton = document.querySelector('#PSforbidai-container .PSheader .PSselect .PSselect-content');
      document.querySelector('#PSforbidai-container .PSheader .PSselect>span').innerHTML = MODE;
      selectButton.addEventListener('click', function (e) {
        if (e.target.tagName.toLowerCase() !== 'span') return;
        let span = document.querySelector('#PSforbidai-container .PSheader .PSselect>span');
        MODE = e.target.innerText;
        span.innerHTML = MODE;
        renderOlList();
      });


      let inputBtn = document.querySelector('#PSforbidai-container .PSheader .PSsearch .PSinput');
      inputBtn.onkeyup = function (e) {
        e.stopPropagation();
        if (e.key == 'Enter' && this.value !== '') {
          search();
        }
      };

      /* 头部区域-搜索框按钮添加点击事件 */
      let button = document.querySelector('#PSforbidai-container .PSheader .PSsearch .PSbutton');
      button.addEventListener('click', search);

      function search() {
        let value = inputBtn.value;
        if (value === "" || value === null || value === undefined) return game.alert("请输入正确内容");
        if (value.length > 20) return game.alert("输入内容过长");
        let characters = getCharactersId();
        if (characters.length === 0) return game.alert("此页面无法搜索");
        let result = [];
        let reg = new RegExp(value);
        for (let j of characters) {
          if (reg.test(j) || reg.test(lib.translate[j])) {
            result.push(j);
          }
        }
        if (result.length === 0) return game.alert("没有找到相关的武将");
        else {
          SEARCHING = true;
          renderCharacterList(result);
        }
      };

      /* 头部区域-关闭按钮添加点击事件 */
      let close = document.querySelector('#PSforbidai-container .PSheader .PSclose');
      close.addEventListener('click', function () {
        SCROLL = document.querySelector('#PSforbidai-container .PSlist ul').scrollLeft;
        ui.arena.classList.add('menupaused');
        ui.menuContainer.show();
        if (ui.dialog) ui.dialog.show();
        ui.window.removeChild(CONTAINER);
        CONFIG.record = [MODE, ACTIVE1, ACTIVE2, SCROLL, FORBIDAI];
        game.saveExtensionConfigValue('AI禁将', 'forbidai');
      });

      /* 武将包列表区域-左右按钮添加点击/长按事件 */
      let timeId;
      let timeId2;
      let ul = document.querySelector('#PSforbidai-container .PSlist ul');

      function hold() {
        let num = this.className === 'PSdiv PSleft' ? -100 : 100;
        ul.scrollLeft += num;
        timeId2 = setTimeout(() => timeId = setInterval(() => ul.scrollLeft += num, 100), 300);
      };
      let left = document.querySelector('#PSforbidai-container .PSlist .PSleft');
      let right = document.querySelector('#PSforbidai-container .PSlist .PSright');
      left.addEventListener(lib.config.touchscreen ? 'touchstart' : 'mousedown', hold);
      right.addEventListener(lib.config.touchscreen ? 'touchstart' : 'mousedown', hold);

      /* 武将包名称栏绑定横向滚动操作逻辑 */
      ul.addEventListener('wheel', function (e) {
        e.preventDefault();
        ul.scrollLeft += e.deltaY / 2;
      });
      setTimeout(() => {
        ul.scrollLeft = SCROLL;
      }, 50);

      /* 内容区域-左侧禁将列表按钮添加点击事件 */
      let forbiden = document.querySelector('#PSforbidai-container .PScontent .PSresult .PSforbiden');
      if (FORBIDAI) forbiden.classList.add('active');
      forbiden.addEventListener('click', function () {
        if (this.classList.toggle('active')) {
          FORBIDAI = true;
          renderCharacterList();
        } else {
          FORBIDAI = false;
          renderCharacterList();
        }
      });

      /* 内容区域-左侧确认禁将按钮添加点击事件 */
      let confirm = document.querySelector('#PSforbidai-container .PScontent .PSresult .PSconfirm');
      confirm.addEventListener(lib.config.touchscreen ? 'touchstart' : 'mousedown', function () {
        this.style.boxShadow = `rgba(0, 0, 0, 0.2) 0 0 0 1px, rgba(0, 255, 0, 0.4) 0 0 5px, rgba(0, 255, 0, 0.4) 0 0 12px, rgba(0, 255, 0, 0.8) 0 0 15px`
        this.style.transform = `scale(0.86)`;
      });
      confirm.addEventListener(lib.config.touchscreen ? 'touchend' : 'mouseup', function () {
        let allBannedList1 = Object.keys(lib.character).filter(id => lib.filter.characterDisabled(id) && !savedFilter(id));// 1.当前禁将
        let allBannedList2 = [...new Set([...selectedBannedList, ...allBannedList1])];// 2.当前禁将 + 已选禁将
        let allBannedList3 = allBannedList2.filter(id => !reducedBannedList.includes(id));// 3.过滤掉2的已移除禁将和系统禁将
        selectedBannedList.splice(0, selectedBannedList.length);
        reducedBannedList.splice(0, reducedBannedList.length);

        {
          CONFIG.record = [MODE, ACTIVE1, ACTIVE2, SCROLL, FORBIDAI];
          CONFIG.bannedList = allBannedList3;
          CONFIG.defaultImage = CONFIG.defaultImage;
          CONFIG.addMenu = CONFIG.addMenu;
          CONFIG.remember = CONFIG.remember;
          CONFIG.small = CONFIG.small;
          CONFIG.hide = CONFIG.hide;
          game.saveExtensionConfigValue('AI禁将', 'forbidai');
        }
        game.alert(`新增禁用武将${allBannedList3.length - allBannedList1.length}个<br><br>已选禁用武将${allBannedList3.length}个<br><br>合计禁用武将${Object.keys(lib.character).filter(id => lib.filter.characterDisabled(id)).length}个`);
        const items = document.querySelectorAll('#PSforbidai-container .PScharacterList .PSitem');

        items.forEach(item => {
          if (item.lastChild.classList.contains('PStip')) {
            if (!item.firstChild.classList.contains('PSselected')) {
              const selected = ui.create.div('.PSdiv .PSselected');
              selected.style.borderRadius = window.getComputedStyle(item).borderRadius;
              item.insertBefore(selected, item.firstElementChild);
            }
          } else {
            if (item.firstChild.classList.contains('PSselected')) {
              item.removeChild(item.firstElementChild);
            }
          }
        });
        // renderCharacterList();
      });

      CONTAINER.addEventListener(lib.config.touchscreen ? 'touchend' : 'mouseup', function () {
        let confirm = document.querySelector('#PSforbidai-container .PScontent .PSresult .PSconfirm');
        confirm.style.boxShadow = 'none';
        confirm.style.transform = `scale(0.8)`;
        clearInterval(timeId);
        clearTimeout(timeId2);
      });

      /* 武将包列表-渲染每一个武将包 */
      let packlist = [];
      for (let i = 0; i < lib.config.all.characters.length; i++) {
        if (!lib.config.characters.includes(lib.config.all.characters[i])) continue;
        packlist.push(lib.config.all.characters[i]);
      }
      for (let i in lib.characterPack) {
        if (!lib.config.all.characters.includes(i) && Object.keys(lib.characterPack[i]).length) {
          packlist.push(i);
        }
      }
      //packlist开启的武将包id数组
      packlist.unshift('all');
      //渲染每一个ul>li并添加点击事件
      packlist.forEach(ele => {
        let li = document.createElement('li');
        li.setAttribute('data-id', ele);
        if (ele === ACTIVE1) li.classList.add('active');
        li.innerHTML = ele === 'all' ? '全扩' : lib.translate[ele + '_character_config'];
        li.addEventListener('click', function () {
          let liAct = document.querySelector('.PSlist li.active');
          if (liAct === this && !SEARCHING || !liAct) return;
          if (SEARCHING) {
            SEARCHING = false;
          }
          liAct.classList.remove('active');
          ACTIVE1 = this.getAttribute('data-id');
          this.classList.add('active');
          renderOlList();
        });
        ul.appendChild(li);
      });
      if (!document.querySelector('.PSlist ul li.active')) {
        ACTIVE1 = ul.firstChild.getAttribute('data-id');
        ul.firstChild.classList.add('active');
      }
      renderOlList();
    }

    /* 内容区域-渲染武将包分类信息 */
    function renderOlList() {
      let ol = document.querySelector('#PSforbidai-container .PScontent ol');
      ol.innerHTML = '';
      let characterSortList = [];
      let liAct = document.querySelector('.PSlist ul li.active');
      switch (MODE) {
        case '默认':
          characterSortList = liAct.dataset.id === 'all' ? [] : Object.keys(lib.characterSort[liAct.dataset.id] || {});
          characterSortList.unshift('all');
          break;
        case '评级':
          characterSortList = ['all', ...Object.keys(lib.rank.rarity)];
          break;
        case '势力':
          characterSortList = ['all', ...lib.group];
          break;
        case '性别':
          characterSortList = ['all', 'male', 'female', 'double'];
          break;
      }
      characterSortList.forEach(ele => {
        let li = document.createElement('li');
        li.setAttribute('data-id', ele);
        if (ele === ACTIVE2) li.classList.add('active');
        li.innerHTML = ele === 'all' ? '所有武将' : lib.translate[ele];
        li.addEventListener('click', function () {
          let li = document.querySelector('.PScontent li.active');
          if (li === this && !SEARCHING || !li) return;
          if (SEARCHING) {
            SEARCHING = false;
          }
          li.classList.remove('active');
          ACTIVE2 = this.getAttribute('data-id');
          this.classList.add('active');
          renderCharacterList();
        });
        ol.appendChild(li);
      });
      if (!document.querySelector('.PScontent ol li.active')) {
        ACTIVE2 = ol.firstChild.dataset.id;
        ol.firstChild.classList.add('active');
      }
      renderCharacterList();
    }

    /* 内容区域-渲染每一个武将 */
    function renderCharacterList(characterArr) {
      let characters = characterArr || getCharactersId();
      if (FORBIDAI) characters = characters.filter(id => lib.filter.characterDisabled(id) || selectedBannedList.includes(id));
      if (CONFIG.hide) characters = characters.filter(id => !savedFilter(id));
      characters.sort((a, b) => (!lib.filter.characterDisabled(b)) - (!lib.filter.characterDisabled(a)));
      document.querySelector('#PSforbidai-container .PSheader .PSloginfo span').innerHTML = `${characters.length}`;
      let PScontent = document.querySelector('#PSforbidai-container .PScontent');
      var oldDialog = _status.event.dialog || ui.dialog;
      var dialog = ui.create.dialog();
      dialog.classList.add('PSdiv');
      dialog.classList.add('PScharacterList');
      dialog.classList.remove('nobutton');
      dialog.classList.add('content');
      dialog.classList.add('fixed');
      dialog.style.transform = '';
      dialog.style.opacity = '';
      dialog.style.height = '';
      ui.dialog = oldDialog;
      if (PScontent.lastElementChild.classList.contains('PScharacterList')) {
        PScontent.removeChild(PScontent.lastElementChild);
      }
      PScontent.appendChild(dialog);

      let buttons = ui.create.div('.buttons', dialog.content);
      if (CONFIG.small) buttons.classList.add('smallzoom');

      characters.forEach(ele => {
        let node = ui.create.button(ele, 'character', buttons, false);
        dialog.buttons.push(node);
        node.classList.add('PSitem');
        node.setAttribute('data-name', ele);
        if (CONFIG.defaultImage) node.style.backgroundImage = `url(${lib.assetURL}extension/AI禁将/image/default_character.jpg)`;
        else {
          node.setAttribute('data-src', node.style.backgroundImage);
          node.style.backgroundImage = '';
        }

        if (savedFilter(ele)) {
          node.style.opacity = '0.5';
          return;
        }
        if ((selectedBannedList.includes(ele) || lib.filter.characterDisabled(ele)) && !reducedBannedList.includes(ele)) {
          if (!node.lastChild.classList.contains('PStip')) {
            const child = ui.create.div('.PSdiv .PStip');
            node.appendChild(child);
          }
        }
        if (lib.filter.characterDisabled(ele) && !node.firstChild.classList.contains('PSselected')) {
          const selected = ui.create.div('.PSdiv .PSselected');
          selected.style.borderRadius = window.getComputedStyle(node).borderRadius;
          node.insertBefore(selected, node.firstElementChild);
        }

        node.addEventListener('click', function () {
          if (this.lastChild.classList.contains('PStip')) {
            this.removeChild(this.lastChild);
            selectedBannedList.remove(ele);
            reducedBannedList.push(ele);
          } else {
            let child = ui.create.div('.PSdiv .PStip');
            this.appendChild(child);
            selectedBannedList.push(ele);
            reducedBannedList.remove(ele);
          }
        });
      });
      if (!CONFIG.defaultImage) lazyLoad();
      dialog.open();
    }

    function lazyLoad() {
      const imgs = document.querySelectorAll('#PSforbidai-container .PScharacterList .PSitem');
      const io = new IntersectionObserver((entries) => {
        entries.forEach(item => {
          if (item.isIntersecting) {//item.isIntersecting
            let oImg = item.target
            if (item.intersectionRatio > 0 && item.intersectionRatio <= 1) {
              // console.log(oImg.getAttribute('data-src'));
              oImg.style.backgroundImage = oImg.getAttribute('data-src');
              //oImg.setAttribute('src', oImg.getAttribute('data-src'))
              io.unobserve(oImg);
            }
          }//
        })
      })
      Array.from(imgs).forEach((it) => {
        // console.log(it.getAttribute('data-src'))
        io.observe(it)
      })
    }


    function getCharactersId() {
      let characters = [];
      if (ACTIVE1 === 'all' && ACTIVE2 === 'all') {
        characters = Object.keys(lib.character);
      }
      else {
        switch (MODE) {
          case '默认':
            if (ACTIVE2 === 'all') characters = Object.keys(lib.characterPack[ACTIVE1]);
            else characters = lib.characterSort[ACTIVE1][ACTIVE2];
            break;
          case '评级':
            if (ACTIVE1 === 'all') {
              characters = lib.rank.rarity[ACTIVE2];
            } else if (ACTIVE2 === 'all') {
              characters = Object.keys(lib.characterPack[ACTIVE1]);
            } else {
              characters = [...new Set(Object.keys(lib.characterPack[ACTIVE1]))].filter(id => lib.rank.rarity[ACTIVE2].includes(id));
            }
            break;
          case '势力':
            if (ACTIVE1 === 'all') {
              characters = Object.keys(lib.character).filter(id => lib.character[id][1] === ACTIVE2);
            } else if (ACTIVE2 === 'all') {
              characters = Object.keys(lib.characterPack[ACTIVE1]);
            } else {
              characters = Object.keys(lib.characterPack[ACTIVE1]).filter(id => lib.character[id][1] === ACTIVE2);
            }
            break;
          case '性别':
            if (ACTIVE1 === 'all') {
              characters = Object.keys(lib.character).filter(id => lib.character[id][0] === ACTIVE2);
            } else if (ACTIVE2 === 'all') {
              characters = Object.keys(lib.characterPack[ACTIVE1]);
            } else {
              characters = Object.keys(lib.characterPack[ACTIVE1]).filter(id => lib.character[id][0] === ACTIVE2);
            }
            break;
        }
      }
      return characters.filter(id => id !== undefined && Object.keys(lib.character).includes(id));
    }
  }

  return {
    name: "AI禁将",
    editable: false,
    content: function (config, pack) {
      lib.init.css(lib.assetURL + 'extension/AI禁将', "extension");//调用css样式
      /* <-------------------------AI禁将-------------------------> */
      game.saveExtensionConfigValue = game.saveExtensionConfigValue || function (extension, key) {
        return game.saveExtensionConfig(extension, key, game.getExtensionConfig(extension, key))
      }
      if (game.getExtensionConfig('AI禁将', 'forbidai') === undefined) {
        const history = game.getExtensionConfig('PS武将', 'forbidai');
        if (history) {
          game.saveExtensionConfig('AI禁将', 'forbidai', {
            record: history.record || [],
            bannedList: history.bannedList || [],
            defaultImage: history.defaultImage || false,
            addMenu: history.addMenu || false,
            remember: history.remember || true,
            small: history.small || false,
            hide: history.hide || false,
          });
          game.saveExtensionConfig('PS武将', 'forbidai', {});
          confirm('已自动将“禁将数据”从《PS武将》迁移至《AI禁将》扩展，提醒：《PS武将》的禁将功能将不再适用。');
        } else {
          game.saveExtensionConfig('AI禁将', 'forbidai', {
            record: [],
            bannedList: [],
            defaultImage: false,
            addMenu: false,
            remember: true,
            small: false,
            hide: false,
          });
        }
      }

      setTimeout(() => {
        if (lib.extensionMenu.extension_PS武将 && lib.extensionMenu.extension_PS武将.PS_forbidai) {
          delete lib.extensionMenu.extension_PS武将.PS_forbidai;
        }
      }, 0);

      (function () {
        let savedFilter = lib.filter.characterDisabled;
        let stockDisabled = false;
        /**
         * 从《玄武江湖》抄来的AI禁将
        */
        lib.filter.characterDisabled = function (i, libCharacter) {
          if (Array.isArray(lib.config['extension_PS武将_PS_bannedList'])) game.saveExtensionConfig('PS武将', 'PS_bannedList', []);//重置旧设置
          if (stockDisabled) return savedFilter(i, libCharacter);
          let list = game.getExtensionConfig('AI禁将', 'forbidai').bannedList || [];
          if (lib.character[i] && list.includes(i)) {
            return true;
          }
          return savedFilter(i, libCharacter);
        };
        /**
         * 判断是否为本体或者其他扩展的禁将
         */
        window.forbidai_savedFilter = function (i, libCharacter) {
          stockDisabled = true;
          let result = lib.filter.characterDisabled(i, libCharacter);
          stockDisabled = false;
          return result;
        };
      }());

      /* <-------------------------从《全能搜索》抄来的加入顶部菜单栏-------------------------> */
      if (game.getExtensionConfig('AI禁将', 'forbidai').addMenu) {
        const getSystem = setInterval(() => {
          if (ui.system1 || ui.system2) {
            clearInterval(getSystem);
            ui.create.system('🈲', function () {
              forbidaiShow();
            });
          }
        }, 500);
      }
    },
    precontent: function () { },
    help: {},
    config: {

      "forbidai_bg": {
        name: "AI禁将界面背景图片",
        init: game.getExtensionConfig('AI禁将', 'forbidai_bg') === undefined ? "default" : game.getExtensionConfig('AI禁将', 'forbidai_bg'),
        unfrequent: true,
        "item": {
          'default': '默认',
          'shadow': '跟随本体'
        },
        onclick: function (item) {
          game.saveExtensionConfig('AI禁将', 'forbidai_bg', item);
        },
      },

      "forbidai": {
        "clear": true,
        name: '<ins>打开禁将界面</ins>',
        onclick: function () {
          forbidaiShow();
        },
      },
    },

    package: {
      intro: "版本：1.2",
      author: '九个芒果',
      diskURL: "",
      forumURL: "",
      version: 1.2,
    }, files: { "character": [], "card": [], "skill": [] },
  }
})