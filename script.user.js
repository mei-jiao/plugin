// ==UserScript==
// @name         vk_clients_add
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  当特定元素文本包含 'Create client account' 时，在指定元素下方插入输入框和两个 select 框
// @author       You
// @match        https://ads.vk.com/hq/dashboard
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      *
// @updateURL    https://raw.githubusercontent.com/mei-jiao/plugin/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/mei-jiao/plugin/main/script.user.js

// ==/UserScript==

(function () {
    'use strict';

    // 添加基本的样式
    GM_addStyle(`
      .custom-form {
            margin-top: 20px;
            border: 1px solid #ccc;
            padding: 20px;
        }
      .custom-form label {
            display: block;
            margin-bottom: 5px;
        }
      .custom-form input,
      .custom-form select {
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            box-sizing: border-box;
        }
      .custom-form div.button-like {
            padding: 8px 15px;
            background-color: #007BFF;
            color: white;
            border: none;
            cursor: pointer;
        }
      .custom-form div.button-like:hover {
            background-color: #0056b3;
        }
      .result-container div.button-like {
            padding: 8px 15px;
            background-color: #007BFF;
            color: white;
            border: none;
            cursor: pointer;
        }
      .result-container {
            margin-top: 20px;
            border: 1px solid #ccc;
            padding: 20px;
        }
      .editable-input {
            border: none;
            background-color: transparent;
            cursor: pointer;
            width: 6vw;
        }
      .editable-input:focus {
            border: 1px solid #007BFF;
            background-color: white;
        }
      .searchable-select {
            position: relative;
        }
      .searchable-select input[type="text"] {
            width: 100%;
            padding: 8px;
            box-sizing: border-box;
        }
      .searchable-select ul {
            position: absolute;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ccc;
            background-color: white;
            list-style-type: none;
            padding: 0;
            margin: 0;
            display: none;
        }
      .searchable-select ul li {
            padding: 8px;
            cursor: pointer;
        }
      .searchable-select ul li:hover {
            background-color: #f0f0f0;
        }
      .tips{
            color: grey;
            font-size:12px;
            display: block; /* 使提示文字独占一行，兼容各宽度页面 */
        }
      .div-save-button {
            padding: 8px 15px;
            background-color: #007BFF;
            color: white;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
      .div-save-button:hover {
            background-color: #0056b3;
        }
      .div-confirm-button {
            padding: 8px 15px;
            background-color: #007BFF;
            color: white;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
      .div-confirm-button:hover {
            background-color: #0056b3;
        }
    `);

    console.log('启用');

    let isInserted = false;
    let isChecking = false; // 新增标志位，避免重复检查

    // 获取接口数据
    const getApiData = () => {
        return new Promise((resolve, reject) => {
            const apiUrl = 'http://122.112.167.199/vkdata/client/plugin_detail'; // 替换为实际的接口 URL
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: function (response) {
                    console.log('接口返回', response.responseText);
                    try {
                        const data = JSON.parse(response.responseText);
                        console.log('接口解析', data);
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: function (error) {
                    reject(error);
                }
            });
        });
    };

    // 检查目标元素是否存在且文本包含指定内容
    const checkAndInsert = async () => {
        console.log('判断isChecking', isChecking);
        if (isChecking) {
            return;
        }
        isChecking = true;

        console.log('判断');

        try {
            // 等待一段时间，确保元素完全加载
            console.log('等待1');
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (document.querySelectorAll('[class^="AccountSwitch_changeAccountName"]').length === 0) {
                return;
            }
            const elementText = document.querySelectorAll('[class^="AccountSwitch_changeAccountName"]')[0].innerText;

            let type;
            if (elementText && elementText.includes('ZHENHE')) {
                type = 2;
            } else {
                type = 1;
            }
            console.log("账号", type);
            if (type === 1 || type === 2) {
                console.log('modalHeader', document.getElementsByClassName('AgencyClientModalV2_modalHeader__S3O-u').length);
                if (document.getElementsByClassName('AgencyClientModalV2_modalHeader__S3O-u').length === 0 || document.getElementsByClassName('vkuiFormItem ').length === 0) {
                    console.log('条件不满足1，不插入');
                    isChecking = false;
                    return;
                }
                const modalHeader = document.getElementsByClassName('AgencyClientModalV2_modalHeader__S3O-u')[0];
                console.log(modalHeader.innerText);
                if (!modalHeader.innerText.includes('Create client account')) {
                    console.log('条件不满足2，不插入');
                    isChecking = false;
                    return;
                }
            }

            if (document.getElementsByClassName('custom-form').length > 0) {
                console.log('自定义表单已存在，不插入');
                isInserted = true;
                isChecking = false;
                return;
            }

            console.log('加载');
            // 修改侧边栏宽度
            if (type === 1 || type === 2) {
                const elements = document.querySelectorAll('.ModalRoot_overlay__a\\+vB9');
                elements.forEach(function (element) {
                    element.style.setProperty('--sidebar-width', '100%');
                });
            }

            // 获取接口数据
            const apiData = await getApiData();
            const { customerList, formSettings } = apiData;
            console.log('接口解析1', customerList);
            console.log('接口解析2', formSettings);
            console.log('开始插入表单');

            // 创建表单容器
            const formContainer = document.createElement('div');
            formContainer.classList.add('custom-form');

            // 创建客户名称搜索框和下拉列表
            const customerLabel = document.createElement('label');
            customerLabel.textContent = '选择客户名称';
            const requiredSymbol1 = document.createElement('span');
            requiredSymbol1.classList.add('FormItem_requiredSymbol__1xv4T');
            requiredSymbol1.textContent = '*';
            customerLabel.appendChild(requiredSymbol1);
            const searchableSelect = document.createElement('div');
            searchableSelect.classList.add('searchable-select');
            const customerSearchInput = document.createElement('input');
            customerSearchInput.type = 'text';
            customerSearchInput.placeholder = '搜索客户名称';
            const customerOptionsList = document.createElement('ul');

            // 在客户名称搜索框后增加灰色提示
            const customerSearchTips = document.createElement('span');
            customerSearchTips.classList.add('tips');
            customerSearchTips.textContent = '(搜索已有客户简称，全新客户直接填写并回车确认)';
            customerLabel.appendChild(customerSearchTips);

            const customerSelect = document.createElement('select');
            customerSelect.innerHTML = '<option value="">请选择</option>'; // 初始化设置一个空选项
            customerList.forEach(option => {
                const opt = document.createElement('option');
                opt.textContent = option.name;
                opt.value = option.id; // 使用 id 作为值
                customerSelect.appendChild(opt);

                const li = document.createElement('li');
                li.textContent = option.name;
                li.dataset.value = option.id; // 使用 id 作为值
                li.addEventListener('click', function () {
                    customerSearchInput.value = this.textContent;
                    customerSelect.value = this.dataset.value;
                    customerOptionsList.style.display = 'none';
                });
                customerOptionsList.appendChild(li);
            });

            // 搜索功能
            customerSearchInput.addEventListener('input', function () {
                const searchTerm = this.value.toLowerCase();
                const items = customerOptionsList.getElementsByTagName('li');
                let hasMatch = false;
                for (let i = 0; i < items.length; i++) {
                    const itemText = items[i].textContent.toLowerCase();
                    if (itemText.includes(searchTerm)) {
                        items[i].style.display = 'block';
                        hasMatch = true;
                    } else {
                        items[i].style.display = 'none';
                    }
                }
                if (searchTerm) {
                    customerOptionsList.style.display = 'block';
                } else {
                    customerOptionsList.style.display = 'none';
                }
                if (!hasMatch) {
                    customerSelect.value = '';
                }
            });

            // 新增回车事件处理
            customerSearchInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    const items = customerOptionsList.getElementsByTagName('li');
                    let hasMatch = false;
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].style.display!== 'none') {
                            hasMatch = true;
                            break;
                        }
                    }

                    const searchValue = this.value;
                    if (searchValue) {
                        customerSelect.value = '';
                        customerOptionsList.style.display = 'none';
                    }

                }
            });

            searchableSelect.appendChild(customerSearchInput);
            searchableSelect.appendChild(customerOptionsList);
            formContainer.appendChild(customerLabel);
            formContainer.appendChild(searchableSelect);
            formContainer.appendChild(customerSelect);
            customerSelect.style.display = 'none';

            // 创建客户昵称 input 框
            const nicknameLabel = document.createElement('label');
            nicknameLabel.textContent = '客户昵称';
            const requiredSymbolNickname = document.createElement('span');
            requiredSymbolNickname.classList.add('FormItem_requiredSymbol__1xv4T');
            requiredSymbolNickname.textContent = '*';
            nicknameLabel.appendChild(requiredSymbolNickname);
            const tipsNickname = document.createElement('span');
            tipsNickname.classList.add('tips');
            tipsNickname.textContent = '(优化师自定义)';
            nicknameLabel.appendChild(tipsNickname);
            const nicknameInput = document.createElement('input');
            nicknameInput.placeholder = '输入客户昵称';
            // 使用 title 和 input 一起做 class 标记
            nicknameInput.classList.add('form-item-' + '客户昵称');
            formContainer.appendChild(nicknameLabel);
            formContainer.appendChild(nicknameInput);

            // 根据 formSettings 创建表单元素
            if (Array.isArray(formSettings)) {
                formSettings.forEach(setting => {
                    const label = document.createElement('label');
                    label.textContent = setting.name;

                    // 创建必填项符号
                    const requiredSymbol = document.createElement('span');
                    requiredSymbol.classList.add('FormItem_requiredSymbol__1xv4T');
                    requiredSymbol.textContent = '*';
                    label.appendChild(requiredSymbol);

                    if (setting.type === 'input') {
                        const input = document.createElement('input');
                        input.placeholder = `输入 ${setting.name}`;
                        // 使用 title 和 input 一起做 class 标记
                        input.classList.add('form-item-' + setting.title);
                        formContainer.appendChild(label);
                        formContainer.appendChild(input);
                    } else if (setting.type ==='select') {
                        const select = document.createElement('select');
                        //使用 title 和 select 一起做 class 标记
                        select.classList.add('form-item-' + setting.title);
                        setting.options.forEach(option => {
                            const opt = document.createElement('option');
                            opt.value = option.value;
                            opt.textContent = option.name;
                            select.appendChild(opt);
                        });
                        formContainer.appendChild(label);
                        formContainer.appendChild(select);
                    }
                });
            } else {
                console.error('formSettings 不是一个数组:', formSettings);
            }

            // 创建产品名称 input 框
            const productLabel = document.createElement('label');
            productLabel.textContent = '输入产品名称';
            const requiredSymbol2 = document.createElement('span');
            requiredSymbol2.classList.add('FormItem_requiredSymbol__1xv4T');
            requiredSymbol2.textContent = '*';
            productLabel.appendChild(requiredSymbol2);
            const productInput = document.createElement('input');
            productInput.placeholder = '输入产品名称';
            //使用 title 和 input 一起做 class 标记
            productInput.classList.add('form-item-' + '产品名称');
            formContainer.appendChild(productLabel);
            formContainer.appendChild(productInput);

            //创建开发者名称 input 框
            const developerLabel = document.createElement('label');
            developerLabel.textContent = '输入开发者名称';
            const developerInput = document.createElement('input');
            developerInput.placeholder = '输入开发者名称';
            //使用 title 和 input 一起做 class 标记
            developerInput.classList.add('form-item-' + '开发者名称');
            formContainer.appendChild(developerLabel);
            formContainer.appendChild(developerInput);

            //创建应用端口 select 框
            const portLabel = document.createElement('label');
            portLabel.textContent = '选择应用端口';
            const requiredSymbol3 = document.createElement('span');
            requiredSymbol3.classList.add('FormItem_requiredSymbol__1xv4T');
            requiredSymbol3.textContent = '*';
            portLabel.appendChild(requiredSymbol3);
            const portSelect = document.createElement('select');
            portSelect.multiple = true;
            const portOptions = [
                { value: 'GP', name: 'Google Play' },
                { value: 'RuStore', name: 'RuStore' },
                { value: 'IOS', name: 'App Store' },
                { value: 'Huawei', name: 'Huawei AppGallery' },
                { value: 'Site', name: 'Site' }
            ];
            portOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.textContent = option.name;
                opt.value = option.value;
                portSelect.appendChild(opt);
            });
            //使用 title 和 select 一起做 class 标记
            portSelect.classList.add('form-item-' + '应用端口');
            formContainer.appendChild(portLabel);
            formContainer.appendChild(portSelect);

            //创建合作模式 select 框
            const cooperationLabel = document.createElement('label');
            cooperationLabel.textContent = '选择合作模式';
            const requiredSymbol4 = document.createElement('span');
            requiredSymbol4.classList.add('FormItem_requiredSymbol__1xv4T');
            requiredSymbol4.textContent = '*';
            cooperationLabel.appendChild(requiredSymbol4);
            const cooperationSelect = document.createElement('select');
            const cooperationOptionsDisplay = [
                { value: '1', name: '自投' },
                { value: '2', name: '代投' }
            ];
            const cooperationOptions = type === 2? [
                { value: '1', name: 'z' },
                { value: '2', name: 'd' }
            ] : [
                { value: '1', name: 'ZT' },
                { value: '2', name: 'DT' }
            ];
            cooperationOptionsDisplay.forEach(option => {
                const opt = document.createElement('option');
                opt.textContent = option.name;
                opt.value = option.value;
                cooperationSelect.appendChild(opt);
            });
            //使用 title 和 select 一起做 class 标记
            cooperationSelect.classList.add('form-item-' + '合作模式');
            formContainer.appendChild(cooperationLabel);
            formContainer.appendChild(cooperationSelect);

            //创建自定义 input 框
            const customLabel = document.createElement('label');
            customLabel.textContent = '自定义内容';
            const customInput = document.createElement('input');
            customInput.placeholder = '自定义内容';
            //使用 title 和 input 一起做 class 标记
            customInput.classList.add('form-item-' + '自定义内容');
            formContainer.appendChild(customLabel);
            formContainer.appendChild(customInput);

            // 在自定义 input 框后增加灰色提示
            const customTips = document.createElement('span');
            customTips.classList.add('tips');
            customTips.textContent = '(填写二代简称或者客户要求的其他字段)';
            customLabel.appendChild(customTips);

            // 创建提交 div
            const submitDiv = document.createElement('div');
            submitDiv.textContent = '提交';
            submitDiv.classList.add('button-like');
            formContainer.appendChild(submitDiv);

            // 创建结果展示容器
            const resultContainer = document.createElement('div');
            resultContainer.classList.add('result-container');

            // 创建确认 div
            const confirmDiv = document.createElement('div');
            confirmDiv.textContent = '确认';
            confirmDiv.classList.add('button-like', 'div-confirm-button');

            // 创建一个包含表单和结果展示容器的总容器
            const container = document.createElement('div');
            container.appendChild(formContainer);
            container.appendChild(resultContainer);
            container.appendChild(confirmDiv);

            let formItem;
            let targetInput;
            if (type === 1 || type === 2) {
                formItem = document.getElementsByClassName('vkuiFormItem ')[0];
                targetInput = document.getElementsByClassName('vkuiInput__el')[0];
            }

            // 在指定元素下方插入总容器
            if (formItem) {
                formItem.parentNode.insertBefore(container, formItem.nextSibling);
                isInserted = true;
            } else {
                console.error('未找到指定的 vkuiFormItem 元素');
            }

            // 隐藏 targetButton
            const targetButton = document.getElementsByClassName('vkuiButton--mode-primary')[1];
            if (targetButton) {
                targetButton.style.display = 'none';
            }

            console.log('结束插入表单');

            // 添加保存 div
            const saveDiv = document.createElement('div');
            saveDiv.textContent = '开户信息保存';
            saveDiv.classList.add('button-like', 'div-save-button');
            saveDiv.addEventListener('click', function () {
                console.log('点击save');
                window.onbeforeunload = null;
                if (type === 1) {
                    // if (document.getElementsByClassName('vkuiInput__el').length < 4 || document.getElementsByClassName('vkuiInput__el')[3].value.length == 0) {
                    //     return;
                    // }
                }
                const formData = {};
                console.log(customerSelect.length);
                console.log(customerSelect.value);
                if (customerSelect.value === '') {
                    const searchValue = customerSearchInput.value;
                    if (searchValue) {
                        formData.customer_name = searchValue;
                    } else {
                        // 未选择客户名称时，提示用户
                        alert('请选择客户名称');
                        return;
                    }
                } else {
                    formData.customer_id = customerSelect.value; // 添加 customer_id
                }
                const now = new Date();
                const createDate = now.getFullYear() + '' + (now.getMonth() + 1) + '' + now.getDate();
                formData.createDate = createDate;

                let separator;
                if (type === 1) {
                    separator = '-';
                } else if (type === 2) {
                    separator = '_';
                }
                if (nicknameInput.value == '') {
                    // 未输入产品名称时，提示用户
                    alert('请输入客户昵称');
                    return;
                }

                // 根据 formSettings 收集表单元素的值
                for (const setting of formSettings) {
                    const element = formContainer.querySelector('.form-item-' + setting.title);
                    if (element) {
                        if (element.value === '') {
                            alert(`请输入 ${setting.name}`);
                            return;
                        }
                        formData[setting.title] = element.value;
                    }
                }

                formData.developer = developerInput.value;
                const selectedPorts = Array.from(portSelect.selectedOptions).map(option => option.value);
                if (selectedPorts.length === 0) {
                    alert('请选择应用端口');
                    return;
                }
                formData.port = selectedPorts;
                formData.agent_id = type;
                const cooperationValue = cooperationSelect.value;
                const cooperationDisplay = cooperationOptions.find(option => option.value === cooperationValue).name;
                formData.cooperation = cooperationValue;
                formData.custom = customInput.value;
                formData.product = productInput.value;
                formData.nickname = nicknameInput.value;

                if (formData.product === '') {
                    // 未输入产品名称时，提示用户
                    alert('请输入产品名称');
                    return;
                }


                let finalStr;
                let portDisplay;
                if (selectedPorts.length > 1) {
                    portDisplay = '多端口';
                } else {
                    portDisplay = portOptions.find(option => option.value === selectedPorts[0]).value;
                }
                if (type === 1) {
                    const nonEmptyValues = [formData.nickname, formData.product, portDisplay, createDate, cooperationDisplay, formData.custom].filter(value => value);
                    finalStr = nonEmptyValues.join(separator);
                } else if (type === 2) {
                    let nonEmptyValues = [formData.nickname, formData.product, cooperationDisplay, createDate, portDisplay, formData.custom].filter(value => value);

                    const createDateIndex = nonEmptyValues.indexOf(createDate);
                    if (createDateIndex > 0) {
                        // 调整 nonEmptyValues 确保 cooperationDisplay 和 createDate 相邻
                        const cooperationIndex = nonEmptyValues.indexOf(cooperationDisplay);
                        if (cooperationIndex!== -1 && Math.abs(cooperationIndex - createDateIndex) > 1) {
                            if (cooperationIndex < createDateIndex) {
                                nonEmptyValues.splice(cooperationIndex + 1, 0, nonEmptyValues.splice(cooperationIndex, 1)[0]);
                            } else {
                                nonEmptyValues.splice(createDateIndex, 0, nonEmptyValues.splice(cooperationIndex, 1)[0]);
                            }
                        }
                    }

                    const parts = [];
                    if (nonEmptyValues.length > 0) {
                        parts.push(nonEmptyValues[0]);
                        for (let i = 1; i < nonEmptyValues.length; i++) {
                            const currentValue = nonEmptyValues[i];
                            const prevValue = nonEmptyValues[i - 1];

                            if ((prevValue === cooperationDisplay && currentValue === createDate) || (prevValue === createDate && currentValue === cooperationDisplay)) {
                                // 当 cooperationDisplay 和 createDate 相邻时，不添加分隔符
                                parts.push(currentValue);
                            } else {
                                parts.push(separator + currentValue);
                            }
                        }
                    }
                    finalStr = parts.join('');
                }
                if (targetInput) {
                    targetInput.readOnly = false;
                    targetInput.focus();
                }

                formData.finalStr = targetInput.value;
                console.log("账号名称1", targetInput.value);
                console.log("账号名称2", formData.finalStr);
                if (formData.finalStr === '') {
                    alert('请输入账号名称');
                    return;
                }
                formData.agent_id = type;
                const remoteUrl = 'http://122.112.167.199/vkdata/client/add'; // 替换为实际的远端接口 URL
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: remoteUrl,
                    data: JSON.stringify(formData),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    onload: function (response) {
                        console.log('提交成功:', response.responseText);
                        // 显示 targetButton
                        if (targetButton) {
                            targetButton.style.display = 'block';
                        }
                        // 隐藏无事件不可点击的 save 按钮
                        const disabledSaveButton = document.querySelector('.disabled-save-button');
                        if (disabledSaveButton) {
                            disabledSaveButton.style.display = 'none';
                        }
                    },
                    onerror: function (error) {
                        console.error('提交失败:', error);
                    }
                });
            });
            if (targetInput && document.getElementsByClassName('div-save-button').length === 0) {
                console.log('新提交');
                if (targetButton) {
                    targetButton.parentNode.insertBefore(saveDiv, targetButton.nextSibling);
                    // 在开户信息保存后的位置加入一个无事件不可点击的 save 按钮
                    const disabledSaveButton = document.createElement('div');
                    disabledSaveButton.textContent = 'save';
                    disabledSaveButton.classList.add('disabled-save-button');
                    targetButton.parentNode.insertBefore(disabledSaveButton, targetButton.nextSibling);
                }
            }

            // 提交 div 点击事件处理
            submitDiv.addEventListener('click', function () {
                console.log('点击提交');
                window.onbeforeunload = null;
                console.log('新提交', customerSelect.value);
                const customerValue = customerSelect.value;
                if (customerValue === '') {
                    const searchValue = customerSearchInput.value;
                    if (!searchValue) {
                        // 未选择客户名称时，提示用户
                        alert('请选择客户名称');
                        return;
                    }
                }
                const nickname = nicknameInput.value;
                const product = productInput.value;
                if (product === '') {
                    // 未输入产品名称时，提示用户
                    alert('请输入产品名称');
                    return;
                }
                const developer = developerInput.value;
                const selectedPorts = Array.from(portSelect.selectedOptions).map(option => option.value);
                if (selectedPorts.length === 0) {
                    alert('请选择应用端口');
                    return;
                }
                const portDisplay = selectedPorts.length > 1? '多端口' : portOptions.find(option => option.value === selectedPorts[0]).value;
                const cooperationValue = cooperationSelect.value;
                const cooperationDisplay = cooperationOptions.find(option => option.value === cooperationValue).name;
                const custom = customInput.value;
                const now = new Date();
                const createDate = now.getFullYear() + '' + (now.getMonth() + 1) + '' + now.getDate();

                let separator;
                if (type === 1) {
                    separator = '-';
                } else if (type === 2) {
                    separator = '_';
                }

                let displayValues;
                if (type === 1) {
                    const nonEmptyValues = [nickname, product, portDisplay, createDate, cooperationDisplay, custom].filter(value => value);
                    displayValues = nonEmptyValues;
                } else if (type === 2) {
                    displayValues = [nickname, product, cooperationDisplay, createDate, portDisplay, custom].filter(value => value);
                    // 调整 displayValues 确保 cooperationDisplay 和 createDate 相邻
                    const createDateIndex = displayValues.indexOf(createDate);
                    if (createDateIndex > 0) {
                        const cooperationIndex = displayValues.indexOf(cooperationDisplay);
                        if (cooperationIndex!== -1 && Math.abs(cooperationIndex - createDateIndex) > 1) {
                            if (cooperationIndex < createDateIndex) {
                                displayValues.splice(cooperationIndex + 1, 0, displayValues.splice(cooperationIndex, 1)[0]);
                            } else {
                                displayValues.splice(createDateIndex, 0, displayValues.splice(cooperationIndex, 1)[0]);
                            }
                        }
                    }
                }

                resultContainer.innerHTML = '';

                const inputs = displayValues.map(value => createEditableInput(value));

                if (type === 1) {
                    inputs.forEach((input, index) => {
                        resultContainer.appendChild(input);
                        if (index < inputs.length - 1) {
                            const separatorText = document.createTextNode(separator);
                            resultContainer.appendChild(separatorText);
                        }
                    });
                } else if (type === 2) {
                    if (inputs.length > 0) {
                        resultContainer.appendChild(inputs[0]);

                        const createDateIndex = displayValues.indexOf(createDate);
                        const cooperationIndex = displayValues.indexOf(cooperationDisplay);

                        for (let i = 1; i < inputs.length; i++) {
                            if ((i === cooperationIndex + 1 && i === createDateIndex) || (i === createDateIndex + 1 && i === cooperationIndex)) {
                                // 当 cooperationDisplay 和 createDate 相邻时，不添加分隔符
                                resultContainer.appendChild(inputs[i]);
                            } else {
                                resultContainer.appendChild(document.createTextNode(separator));
                                resultContainer.appendChild(inputs[i]);
                            }
                        }
                    }
                }

                // 确认 div 点击事件处理
                confirmDiv.addEventListener('click', function () {
                    console.log('点击确认');
                    window.onbeforeunload = null;
                    let finalStr;
                    if (type === 1) {
                        const values = inputs.map(input => input.value);
                        finalStr = values.join(separator);
                    } else if (type === 2) {
                        const createDate = new Date().getFullYear() + '' + (new Date().getMonth() + 1) + '' + new Date().getDate();

                        const values = [];
                        const childNodes = resultContainer.childNodes;
                        for (let i = 0; i < childNodes.length; i++) {
                            if (childNodes[i].tagName === 'INPUT') {
                                values.push(childNodes[i].value);
                            }
                        }

                        // 调整 values 确保 cooperationDisplay 和 createDate 相邻
                        const createDateIndex = values.indexOf(createDate);
                        if (createDateIndex > 0) {
                            const cooperationIndex = values.indexOf(cooperationDisplay);
                            if (cooperationIndex!== -1 && Math.abs(cooperationIndex - createDateIndex) > 1) {
                                if (cooperationIndex < createDateIndex) {
                                    values.splice(cooperationIndex + 1, 0, values.splice(cooperationIndex, 1)[0]);
                                } else {
                                    values.splice(createDateIndex, 0, values.splice(cooperationIndex, 1)[0]);
                                }
                            }
                        }

                        const parts = [];
                        if (values.length > 0) {
                            parts.push(values[0]);
                            for (let i = 1; i < values.length; i++) {
                                const currentValue = values[i];
                                const prevValue = values[i - 1];

                                if ((prevValue === cooperationDisplay && currentValue === createDate) || (prevValue === createDate && currentValue === cooperationDisplay)) {
                                    // 当 cooperationDisplay 和 createDate 相邻时，不添加分隔符
                                    parts.push(currentValue);
                                } else {
                                    parts.push(separator + currentValue);
                                }
                            }
                        }
                        finalStr = parts.join('');
                    }
                    if (targetInput) {
                        navigator.clipboard.writeText(finalStr).then(function () {
                            console.log('复制成功！');

                            // 获取 VKUI 输入框
                            var inputEl = document.querySelector('.vkuiInput__el');
                            if (inputEl) {
                                inputEl.focus(); // 让输入框获取焦点

                                // **方法 1：手动触发 onChange 事件**
                                var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                nativeInputValueSetter.call(inputEl, finalStr); // 设置值

                                var event = new Event('input', { bubbles: true });
                                inputEl.dispatchEvent(event); // 触发 VKUI 监听的事件

                                console.log('已成功粘贴值');
                            } else {
                                console.error('未找到 VKUI 输入框');
                            }

                        }).catch(function (err) {
                            console.error('无法写入剪贴板:', err);
                        });
                    }
                });
            });
        } catch (error) {
            console.error('获取接口数据失败:', error);
        } finally {
            isChecking = false;
        }
    };

    // 创建可双击编辑的 input 框
    function createEditableInput(value) {
        const input = document.createElement('input');
        input.value = value;
        input.classList.add('editable-input');
        input.readOnly = true;
        input.addEventListener('dblclick', function () {
            this.readOnly = false;
            this.focus();
        });
        input.addEventListener('blur', function () {
            this.readOnly = true;
        });
        return input;
    }

    // 页面加载完成后检查一次
    window.addEventListener('load', checkAndInsert);

    // 使用 MutationObserver 监听页面变化，处理动态加载的情况
    const observer = new MutationObserver(checkAndInsert);
    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
})();
