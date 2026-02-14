// 词根数据库
let wordDatabase = {};

// 从JSON文件加载词典
fetch('./dictionary.json')
    .then(res => res.json())
    .then(data => {
        wordDatabase = data;
        console.log(`词典加载成功: ${Object.keys(wordDatabase).length} 个单词`);
    })
    .catch(err => {
        console.error('词典加载失败:', err);
        // 使用内置备用数据
        wordDatabase = {
            "example": {
                word: "example",
                roots: [
                    { root: "ex-", meaning: "出，外" },
                    { root: "empl", meaning: "拿，取" }
                ]
            }
        };
    });

function searchWord(word) {
    return wordDatabase[word];
}

// 本地存储管理
const Storage = {
    getFavorites() {
        const data = localStorage.getItem('favorites');
        return data ? JSON.parse(data) : [];
    },
    saveFavorites(favorites) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    },
    addFavorite(word) {
        const favorites = this.getFavorites();
        if (!favorites.includes(word)) {
            favorites.push(word);
            this.saveFavorites(favorites);
        }
    },
    removeFavorite(word) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(w => w !== word);
        this.saveFavorites(filtered);
    },
    isFavorite(word) {
        return this.getFavorites().includes(word);
    }
};

// 当前显示的单词
let currentWord = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSearch();
    renderFavorites();
    registerServiceWorker();
});

// 导航切换
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            if (tabName === 'favorites') {
                renderFavorites();
            }
        });
    });
}

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchBtn.addEventListener('click', () => search());
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') search();
    });
}

function search() {
    const input = document.getElementById('searchInput');
    const word = input.value.trim().toLowerCase();
    
    if (!word) return;
    
    console.log('搜索单词:', word);
    
    // 显示加载状态
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div class="loading">正在查询...</div>';
    
    // 1. 检查本地词典
    const localResult = searchWord(word);
    
    // 2. 总是进行在线查询（无论本地是否有结果）
    searchOnlineEnhanced(word, localResult);
}

// 词根分析器 - 使用增强版本
const RootAnalyzer = {
    async analyze(word) {
        console.log('词根分析器调用:', word);
        console.log('EnhancedRootAnalyzer是否可用:', typeof EnhancedRootAnalyzer !== 'undefined');
        
        // 如果增强分析器可用，优先尝试AI分析
        if (typeof EnhancedRootAnalyzer !== 'undefined' && EnhancedRootAnalyzer.analyzeWithAI) {
            try {
                const aiResult = await EnhancedRootAnalyzer.analyzeWithAI(word);
                console.log('AI分析结果:', aiResult);
                
                // 直接返回AI结果，保持所有字段
                if (aiResult && (aiResult.result || aiResult.roots)) {
                    return {
                        result: aiResult.result || aiResult.roots,
                        source: aiResult.source || 'AI',
                        etymology: aiResult.etymology,
                        related: aiResult.related
                    };
                }
            } catch (e) {
                console.log('AI分析失败，使用本地分析:', e.message);
            }
        }
        
        // 使用本地增强分析器
        if (typeof EnhancedRootAnalyzer !== 'undefined' && EnhancedRootAnalyzer.analyze) {
            try {
                const result = EnhancedRootAnalyzer.analyze(word);
                console.log('增强分析器结果:', result);
                if (result && result.length > 0) {
                    return { result: result, source: 'local' };
                }
            } catch (e) {
                console.error('增强分析器错误:', e);
            }
        }
        
        // 否则使用基础分析器
        console.log('使用基础分析器');
        const result = this.basicAnalyze(word);
        return { result: result, source: 'basic' };
    },
    
    basicAnalyze(word) {
        const prefixes = {
            'un-': '不，非', 're-': '再，重新', 'pre-': '预先，在前', 'dis-': '不，分离',
            'mis-': '错误，坏', 'over-': '过度，在上', 'under-': '在下，不足', 'out-': '超过，向外',
            'in-': '在内，向内', 'ex-': '向外，前任', 'sub-': '在下，次', 'super-': '超级，在上',
            'inter-': '在...之间', 'trans-': '穿过，转换', 'anti-': '反对，抗', 'pro-': '支持，向前',
            'con-': '共同，一起', 'de-': '去除，向下', 'auto-': '自动，自己', 'semi-': '半',
            'multi-': '多', 'mono-': '单一', 'bi-': '二，双', 'tri-': '三', 'micro-': '微小',
            'macro-': '宏大', 'mini-': '小', 'neo-': '新', 'ab-': '离开，脱离', 'ad-': '向，朝',
            'com-': '共同', 'im-': '向内，不', 'non-': '不，非'
        };
        
        const suffixes = {
            '-tion': '名词后缀', '-sion': '名词后缀', '-ment': '名词后缀', '-ness': '名词后缀',
            '-ity': '名词后缀', '-ism': '名词后缀', '-ist': '表示人', '-er': '表示人或物',
            '-or': '表示人或物', '-able': '能够的', '-ible': '能够的', '-ful': '充满的',
            '-less': '没有的', '-ous': '具有...性质', '-ic': '...的', '-al': '...的',
            '-ive': '有...倾向', '-ly': '副词后缀', '-ize': '使成为', '-ate': '动词/形容词后缀',
            '-ed': '过去式/形容词', '-ing': '进行时/名词', '-ent': '形容词后缀', '-ant': '形容词后缀'
        };
        
        const roots = {
            'act': '做，行动', 'aud': '听', 'bio': '生命', 'cap': '拿，抓', 'ced': '走',
            'cept': '拿，抓', 'dict': '说', 'duc': '引导', 'fac': '做', 'fer': '带来',
            'form': '形状', 'gen': '产生', 'graph': '写', 'ject': '投掷', 'lect': '选择',
            'log': '说话', 'man': '手', 'mit': '送', 'mov': '移动', 'port': '带来',
            'pos': '放置', 'press': '压', 'script': '写', 'sect': '切', 'spect': '看',
            'struct': '建造', 'tact': '接触', 'ten': '拿，持', 'tract': '拉', 'ven': '来',
            'vers': '转', 'vid': '看', 'vis': '看', 'voc': '声音', 'solut': '松开，解开',
            'solv': '松开，解开', 'lut': '松开', 'lute': '绝对', 'put': '思考', 'comput': '计算',
            'beaut': '美丽', 'ful': '充满', 'aut': '自己', 'tom': '切割', 'mat': '移动，思考',
            // 新增更多词根
            'anim': '生命，心灵', 'ann': '年', 'aqua': '水', 'arch': '统治，主要',
            'arm': '武器，手臂', 'art': '艺术，技巧', 'astro': '星星', 'bell': '战争',
            'bene': '好', 'biblio': '书', 'carn': '肉', 'chron': '时间', 'civ': '公民',
            'clam': '叫喊', 'corp': '身体', 'cosm': '世界，宇宙', 'cred': '相信',
            'culp': '错误，罪', 'cur': '跑，发生', 'cycl': '圆，环', 'dem': '人民',
            'dent': '牙齿', 'derm': '皮肤', 'domin': '主导', 'dorm': '睡眠',
            'equ': '相等', 'err': '错误', 'fid': '信任', 'fin': '结束，边界',
            'flect': '弯曲', 'flu': '流动', 'fort': '强壮', 'frag': '破碎',
            'geo': '地球', 'grad': '步骤，等级', 'grav': '重量', 'greg': '群体',
            'hab': '居住', 'hum': '人类', 'hydr': '水', 'jud': '判断',
            'jur': '法律', 'lab': '工作', 'leg': '法律，选择', 'liber': '自由',
            'loc': '地方', 'luc': '光', 'magn': '大', 'mal': '坏', 'manu': '手',
            'mar': '海', 'mater': '母亲', 'memor': '记忆', 'ment': '心智',
            'metr': '测量', 'migr': '移动', 'min': '小', 'mir': '惊奇',
            'miss': '送，投', 'mob': '移动', 'mort': '死亡', 'mult': '多',
            'nat': '出生', 'nav': '船', 'neg': '否定', 'nom': '名字',
            'nov': '新', 'numer': '数字', 'omni': '全部', 'oper': '工作',
            'opt': '选择', 'ord': '顺序', 'orig': '起源', 'pac': '和平',
            'par': '准备', 'pass': '通过', 'pat': '父亲', 'path': '疾病，情感',
            'ped': '脚', 'pend': '悬挂', 'pet': '寻求', 'phon': '声音',
            'phot': '光', 'plic': '折叠', 'prim': '第一', 'psych': '心理',
            'punct': '点', 'quer': '寻求', 'reg': '统治', 'rupt': '破裂',
            'san': '健康', 'sci': '知道', 'scop': '看', 'sens': '感觉',
            'sequ': '跟随', 'serv': '服务', 'sign': '标志', 'simil': '相似',
            'sist': '站立', 'soci': '社会', 'son': '声音', 'soph': '智慧',
            'spec': '看', 'spir': '呼吸', 'sta': '站立', 'temp': '时间',
            'terr': '土地', 'test': '证明', 'therm': '热', 'tort': '扰曲',
            'urb': '城市', 'vac': '空', 'val': '价值', 'var': '变化',
            'vert': '转', 'viv': '活', 'vol': '意愿', 'vor': '吃',
            // 特殊词根处理
            'aspar': '芦笋', 'asparagus': '芦笋', 'spar': '矿物，闪亮',
            'ag': '做，驱动', 'us': '名词后缀'
        };
        
        const components = [];
        let remaining = word.toLowerCase();
        
        // 查找前缀
        for (const [prefix, meaning] of Object.entries(prefixes)) {
            const prefixClean = prefix.replace('-', '');
            if (remaining.startsWith(prefixClean) && remaining.length > prefixClean.length) {
                components.push({ root: prefix, meaning });
                remaining = remaining.substring(prefixClean.length);
                break;
            }
        }
        
        // 查找后缀
        let suffixFound = null;
        for (const [suffix, meaning] of Object.entries(suffixes)) {
            const suffixClean = suffix.replace('-', '');
            if (remaining.endsWith(suffixClean) && remaining.length > suffixClean.length) {
                suffixFound = { root: suffix, meaning };
                remaining = remaining.substring(0, remaining.length - suffixClean.length);
                break;
            }
        }
        
        // 处理中间部分（词根）
        if (remaining) {
            // 特殊单词处理
            if (remaining === 'asparagus') {
                return [{ root: 'aspar', meaning: '芜笋' }, { root: 'ag', meaning: '做，驱动' }, { root: '-us', meaning: '名词后缀' }];
            } else if (remaining === 'cipher') {
                components.push({ root: 'cipher', meaning: '密码，零' });
            } else if (roots[remaining]) {
                components.push({ root: remaining, meaning: roots[remaining] });
            } else {
                // 尝试部分匹配
                let found = false;
                for (const [root, meaning] of Object.entries(roots)) {
                    if (remaining.includes(root) && root.length >= 3) {
                        components.push({ root, meaning });
                        const leftover = remaining.replace(root, '');
                        if (leftover && leftover.length >= 2) {
                            components.push({ root: leftover, meaning: '词根片段' });
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    components.push({ root: remaining, meaning: '词根' });
                }
            }
        }
        
        if (suffixFound) {
            components.push(suffixFound);
        }
        
        return components;
    },
    
    // 分析剩余部分
    analyzeRemainingParts(remaining, roots) {
        const parts = [];
        let current = remaining;
        
        // 尝试找到更多词根
        for (const [root, meaning] of Object.entries(roots)) {
            if (current.includes(root) && root.length >= 2) {
                parts.push({ root, meaning });
                current = current.replace(root, '');
                break;
            }
        }
        
        if (current && current.length > 0) {
            parts.push({ root: current, meaning: '词根' });
        }
        
        return parts.length > 0 ? parts : [{ root: remaining, meaning: '词根' }];
    },
    
    // 拆分未知单词
    splitUnknownWord(word, roots) {
        // 尝试按音节或常见模式拆分
        if (word.length <= 3) {
            return [{ root: word, meaning: '词根' }];
        }
        
        // 尝试从中间拆分
        const mid = Math.floor(word.length / 2);
        const part1 = word.substring(0, mid);
        const part2 = word.substring(mid);
        
        const parts = [];
        
        // 检查第一部分是否是已知词根
        let found1 = false;
        for (const [root, meaning] of Object.entries(roots)) {
            if (part1.includes(root) && root.length >= 2) {
                parts.push({ root, meaning });
                found1 = true;
                break;
            }
        }
        if (!found1) {
            parts.push({ root: part1, meaning: '词根' });
        }
        
        // 检查第二部分
        let found2 = false;
        for (const [root, meaning] of Object.entries(roots)) {
            if (part2.includes(root) && root.length >= 2) {
                parts.push({ root, meaning });
                found2 = true;
                break;
            }
        }
        if (!found2) {
            parts.push({ root: part2, meaning: '词根' });
        }
        
        return parts;
    }
};

// 增强的在线查词 - 显示本地+在线结果
async function searchOnlineEnhanced(word, localResult) {
    const resultDiv = document.getElementById('result');
    
    // 初始化综合数据
    let combinedData = {
        word: word,
        gloss: '',
        phonetic: '',
        roots: [],
        sources: []
    };
    
    // 添加本地结果
    if (localResult) {
        combinedData.gloss = localResult.gloss || '';
        combinedData.phonetic = localResult.phonetic || '';
        combinedData.roots = localResult.roots || [];
        combinedData.sources.push('本地词典');
        console.log('本地结果:', localResult);
    }
    
    // 添加词根分析（总是进行）
    try {
        const rootAnalysisResult = await RootAnalyzer.analyze(word);
        console.log('词根分析结果:', rootAnalysisResult);
        
        const rootAnalysis = rootAnalysisResult.result || rootAnalysisResult;
        const analysisSource = rootAnalysisResult.source;
        const etymology = rootAnalysisResult.etymology;
        const related = rootAnalysisResult.related;
        
        // 如果没有本地词根或本地词根为空，使用分析结果
        if (!combinedData.roots || combinedData.roots.length === 0 || 
            (rootAnalysis.length > combinedData.roots.length)) {
            combinedData.roots = rootAnalysis;
        }
        
        // 添加词源典故和相关词汇
        if (etymology) {
            combinedData.etymology = etymology;
        }
        if (related && related.length > 0) {
            combinedData.related = related;
        }
        
        // 添加分析源标签
        if (analysisSource === 'AI') {
            combinedData.sources.push('AI词根分析');
        } else {
            combinedData.sources.push('词根分析');
        }
    } catch (error) {
        console.error('词根分析错误:', error);
        // 使用基础分析作为后备
        const basicAnalysis = RootAnalyzer.basicAnalyze ? RootAnalyzer.basicAnalyze(word) : [{ root: word, meaning: '词根' }];
        if (!combinedData.roots || combinedData.roots.length === 0) {
            combinedData.roots = basicAnalysis;
        }
        combinedData.sources.push('基础分析');
    }
    
    // 确保数据完整性
    console.log('显示前的combinedData:', combinedData);
    
    // 显示初始结果
    displayCombinedResult(combinedData, word);
    
    // 并行查询英文和中文API
    try {
        const [englishResult, chineseResult] = await Promise.allSettled([
            getEnglishDefinition(word),
            getChineseTranslation(word)
        ]);
        
        console.log('英文API结果:', englishResult);
        console.log('中文API结果:', chineseResult);
        
        // 处理英文释义
        if (englishResult.status === 'fulfilled' && englishResult.value) {
            const englishDef = englishResult.value.definitions.join(' | ');
            if (combinedData.gloss) {
                combinedData.gloss += ' | ' + englishDef;
            } else {
                combinedData.gloss = englishDef;
            }
            if (englishResult.value.phonetic) {
                combinedData.phonetic = englishResult.value.phonetic;
            }
            combinedData.sources.push('英文词典');
        }
        
        // 处理中文翻译
        if (chineseResult.status === 'fulfilled' && chineseResult.value) {
            const chineseDef = `中文: ${chineseResult.value}`;
            if (combinedData.gloss) {
                combinedData.gloss = chineseDef + ' | ' + combinedData.gloss;
            } else {
                combinedData.gloss = chineseDef;
            }
            combinedData.sources.push('中文翻译');
        }
        
        // 更新显示最终结果
        console.log('最终综合结果:', combinedData);
        console.log('综合结果gloss长度:', combinedData.gloss ? combinedData.gloss.length : 0);
        displayCombinedResult(combinedData, word);
        
        // 自动学习新词
        if (!localResult && (englishResult.status === 'fulfilled' || chineseResult.status === 'fulfilled')) {
            wordDatabase[word] = {
                word: word,
                gloss: combinedData.gloss,
                phonetic: combinedData.phonetic,
                roots: combinedData.roots
            };
            console.log(`已学习新词: ${word}`);
        }
        
    } catch (error) {
        console.error('在线查询错误:', error);
        // 确保显示已有结果
        displayCombinedResult(combinedData, word);
    }
}

// 获取英文释义
async function getEnglishDefinition(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (response.ok) {
            const data = await response.json();
            const entry = data[0];
            
            const definitions = [];
            entry.meanings.slice(0, 2).forEach(meaning => {
                const partOfSpeech = meaning.partOfSpeech;
                meaning.definitions.slice(0, 1).forEach(def => {
                    definitions.push(`${partOfSpeech}: ${def.definition}`);
                });
            });
            
            return {
                definitions: definitions,
                phonetic: entry.phonetic || ''
            };
        }
    } catch (e) {
        console.log('英文API查询失败:', e);
    }
    return null;
}

// 获取中文翻译
async function getChineseTranslation(word) {
    // 先检查内置词汇
    const commonWords = {
        'absolute': '绝对的', 'beautiful': '美丽的', 'wonderful': '精彩的',
        'asparagus': '芦笋', 'incredible': '难以置信的', 'transportation': '运输',
        'communication': '交流', 'international': '国际的', 'psychology': '心理学',
        'democracy': '民主', 'geography': '地理学', 'education': '教育',
        'information': '信息', 'technology': '技术', 'development': '发展',
        'government': '政府', 'organization': '组织', 'environment': '环境',
        'management': '管理', 'relationship': '关系', 'opportunity': '机会',
        'important': '重要的', 'different': '不同的', 'possible': '可能的',
        'available': '可用的', 'necessary': '必要的', 'interesting': '有趣的'
    };
    
    const builtInTranslation = commonWords[word.toLowerCase()];
    if (builtInTranslation) {
        return builtInTranslation;
    }
    
    // 尝试多个API接口
    const translationAPIs = [
        // API 1: MyMemory 免费翻译API
        async () => {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.responseStatus === 200 && data.responseData.translatedText) {
                        const translation = data.responseData.translatedText;
                        // 过滤明显的错误翻译
                        if (!translation.toLowerCase().includes(word.toLowerCase()) && 
                            translation.length < word.length * 3) {
                            return translation;
                        }
                    }
                }
            } catch (e) {
                console.log('MyMemory API失败:', e);
            }
            return null;
        },
        
        // API 2: LibreTranslate (如果有公共实例)
        async () => {
            try {
                const response = await fetch('https://libretranslate.de/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        q: word,
                        source: 'en',
                        target: 'zh',
                        format: 'text'
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.translatedText && data.translatedText !== word) {
                        return data.translatedText;
                    }
                }
            } catch (e) {
                console.log('LibreTranslate API失败:', e);
            }
            return null;
        },
        
        // API 3: 简单的基于词根的智能推测
        async () => {
            const rootMeanings = {
                'trans': '跨越', 'port': '运输', 'ation': '名词',
                'inter': '互相', 'nation': '国家', 'al': '的',
                'psych': '心理', 'ology': '学科',
                'geo': '地理', 'graph': '描述', 'y': '学科',
                'bio': '生命', 'demo': '人民', 'cracy': '统治'
            };
            
            // 简单的词根匹配推测
            for (const [root, meaning] of Object.entries(rootMeanings)) {
                if (word.toLowerCase().includes(root)) {
                    return `含${root}(表示${meaning})的词`;
                }
            }
            
            return null;
        }
    ];
    
    // 依次尝试各个API
    for (const apiCall of translationAPIs) {
        try {
            const result = await apiCall();
            if (result) {
                console.log(`中文翻译成功: ${word} -> ${result}`);
                return result;
            }
        } catch (e) {
            console.log('翻译API失败:', e);
            continue;
        }
    }
    
    console.log(`未找到 ${word} 的中文翻译`);
    return null;
}

// 显示综合结果
function displayCombinedResult(data, word) {
    const resultDiv = document.getElementById('result');
    
    console.log('显示综合结果 - 输入数据:', data);
    
    if (!data) {
        resultDiv.innerHTML = `
            <div class="no-result">
                未找到单词 "${word}" 的信息
            </div>
        `;
        currentWord = null;
        return;
    }
    
    currentWord = word;
    const isFav = Storage.isFavorite(word);
    
    // 确保 gloss 不为空字符串
    const displayGloss = data.gloss && data.gloss.trim() ? data.gloss : '';
    
    console.log('显示的gloss:', displayGloss);
    console.log('词根数量:', data.roots ? data.roots.length : 0);
    console.log('词源典故:', data.etymology);
    console.log('相关词汇:', data.related);
    
    resultDiv.innerHTML = `
        <div class="word-card">
            <div class="word-header">
                <div>
                    <div class="word-title">${data.word}</div>
                    ${data.phonetic ? `<div class="word-phonetic">[${data.phonetic}]</div>` : ''}
                    ${displayGloss ? `<div class="word-gloss">${displayGloss}</div>` : ''}
                    <div class="badges">
                        ${data.sources && data.sources.length > 0 ? data.sources.map(source => `<span class="source-badge">${source}</span>`).join('') : '<span class="source-badge">词根分析</span>'}
                    </div>
                </div>
                <button class="favorite-btn" onclick="toggleFavorite()">
                    ${isFav ? '⭐' : '☆'}
                </button>
            </div>
            ${data.roots && data.roots.length > 0 ? `
                <div class="roots">
                    <div class="roots-title">词根分析：</div>
                    ${data.roots.map((r, index) => `
                        <div class="root-item" data-index="${index}">
                            <div class="root-name">${r.root}</div>
                            <div class="root-meaning">${r.meaning}</div>
                            <button class="edit-root-btn" onclick="editRoot('${word}', ${index}, '${r.root}', '${r.meaning}')" title="修正词根">✏️</button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            ${data.etymology ? `
                <div class="etymology">
                    <div class="etymology-title">词源典故：</div>
                    <div class="etymology-content">${data.etymology}</div>
                </div>
            ` : ''}
            ${data.related && data.related.length > 0 ? `
                <div class="related-words">
                    <div class="related-title">相关词汇：</div>
                    <div class="related-list">
                        ${data.related.map(word => `<span class="related-word" onclick="searchRelatedWord('${word}')">${word}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="word-actions">
                <button onclick="showLearningStats()" class="stats-btn">学习统计</button>
                <button onclick="findSimilarWords('${word}')" class="similar-btn">相似词汇</button>
                <button onclick="showRootTree('${word}')" class="tree-btn">词根树</button>
            </div>
            <div id="rootTreeContainer" style="display: none;"></div>
        </div>
    `;
}

function displayResult(data, word) {
    const resultDiv = document.getElementById('result');
    
    if (!data) {
        resultDiv.innerHTML = `
            <div class="no-result">
                未找到单词 "${word}" 的信息
            </div>
        `;
        currentWord = null;
        return;
    }
    
    currentWord = word;
    const isFav = Storage.isFavorite(word);
    
    console.log('显示结果 - 词根数量:', data.roots ? data.roots.length : 0);
    console.log('词根详情:', data.roots);
    
    resultDiv.innerHTML = `
        <div class="word-card">
            <div class="word-header">
                <div>
                    <div class="word-title">${data.word}</div>
                    ${data.phonetic ? `<div class="word-phonetic">[${data.phonetic}]</div>` : ''}
                    ${data.gloss ? `<div class="word-gloss">${data.gloss}</div>` : ''}
                    <div class="badges">
                        ${data.isOnline ? '<span class="online-badge">在线查询</span>' : '<span class="local-badge">本地词典</span>'}
                        ${data.source ? `<span class="source-badge">${getSourceLabel(data.source)}</span>` : ''}
                    </div>
                </div>
                <button class="favorite-btn" onclick="toggleFavorite()">
                    ${isFav ? '⭐' : '☆'}
                </button>
            </div>
            ${data.roots && data.roots.length > 0 ? `
                <div class="roots">
                    <div class="roots-title">词根分析：</div>
                    ${data.roots.map((r, index) => `
                        <div class="root-item" data-index="${index}">
                            <div class="root-name">${r.root}</div>
                            <div class="root-meaning">${r.meaning}</div>
                            <button class="edit-root-btn" onclick="editRoot('${word}', ${index}, '${r.root}', '${r.meaning}')" title="修正词根">✏️</button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="word-actions">
                <button onclick="showLearningStats()" class="stats-btn">学习统计</button>
                <button onclick="findSimilarWords('${word}')" class="similar-btn">相似词汇</button>
            </div>
        </div>
    `;
}

// 获取数据源标签
function getSourceLabel(source) {
    const labels = {
        'free_dict': '词典API',
        'root_analysis': '词根分析',
        'root_only': '仅词根',
        'offline_analysis': '离线分析'
    };
    return labels[source] || source;
}

// 收藏功能
function toggleFavorite() {
    if (!currentWord) return;
    
    if (Storage.isFavorite(currentWord)) {
        Storage.removeFavorite(currentWord);
    } else {
        Storage.addFavorite(currentWord);
    }
    
    // 重新显示结果以更新星标
    const data = wordDatabase[currentWord];
    displayResult(data, currentWord);
}

// 渲染收藏夹
function renderFavorites() {
    const listDiv = document.getElementById('favoritesList');
    const favorites = Storage.getFavorites();
    
    if (favorites.length === 0) {
        listDiv.innerHTML = '<div class="empty-favorites">还没有收藏任何单词</div>';
        return;
    }
    
    listDiv.innerHTML = favorites.map(word => {
        const data = wordDatabase[word];
        if (!data) {
            return `
                <div class="favorite-item">
                    <div class="favorite-word" onclick="viewWord('${word}')">${word}</div>
                    <button class="delete-btn" onclick="deleteFavorite('${word}')">删除</button>
                </div>
            `;
        }
        
        return `
            <div class="favorite-item-detailed">
                <div class="favorite-header">
                    <div class="favorite-word" onclick="viewWord('${word}')">${word}</div>
                    <button class="delete-btn" onclick="deleteFavorite('${word}')">删除</button>
                </div>
                ${data.gloss ? `<div class="favorite-gloss">${data.gloss}</div>` : ''}
                ${data.roots && data.roots.length > 0 ? `
                    <div class="favorite-roots">
                        ${data.roots.map(r => `
                            <span class="favorite-root">${r.root} (${r.meaning})</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function viewWord(word) {
    // 切换到查词页面
    document.querySelector('[data-tab="search"]').click();
    
    // 填充搜索框并搜索
    document.getElementById('searchInput').value = word;
    search();
}

function deleteFavorite(word) {
    Storage.removeFavorite(word);
    renderFavorites();
}

// 注册 Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
                
                // 检查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 有新版本可用
                            if (confirm('发现新版本，是否立即更新？')) {
                                newWorker.postMessage({ action: 'skipWaiting' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(err => console.log('SW registration failed:', err));
        
        // 监听 SW 控制权变化
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }
}

// 导出收藏
function exportFavorites() {
    const favorites = Storage.getFavorites();
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favorites.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 导入收藏
function importFavorites(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const favorites = JSON.parse(e.target.result);
            if (Array.isArray(favorites)) {
                Storage.saveFavorites(favorites);
                renderFavorites();
                alert('导入成功！');
            } else {
                alert('文件格式错误');
            }
        } catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
}

// 编辑词根功能
function editRoot(word, rootIndex, currentRoot, currentMeaning) {
    const newRoot = prompt('请输入正确的词根:', currentRoot);
    if (newRoot === null) return;
    
    const newMeaning = prompt('请输入词根含义:', currentMeaning);
    if (newMeaning === null) return;
    
    // 使用增强词典的修正功能
    enhancedDict.correctRoot(word, rootIndex, newRoot, newMeaning);
    
    // 重新搜索显示
    search();
    
    alert('词根修正已保存，将用于改进未来的分析！');
}

// 显示学习统计
function showLearningStats() {
    const stats = enhancedDict.getLearningStats();
    
    const statsHtml = `
        <div class="stats-modal">
            <div class="stats-content">
                <h3>学习统计</h3>
                <div class="stat-item">
                    <span class="stat-label">总查询次数:</span>
                    <span class="stat-value">${stats.totalSearches}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">查询过的单词:</span>
                    <span class="stat-value">${stats.uniqueWords}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">用户修正:</span>
                    <span class="stat-value">${stats.corrections}</span>
                </div>
                <div class="top-roots">
                    <h4>常用词根 Top 10:</h4>
                    ${stats.topRoots.map(([root, count]) => 
                        `<div class="root-stat">${root}: ${count}次</div>`
                    ).join('')}
                </div>
                <div class="stats-actions">
                    <button onclick="enhancedDict.exportLearningData()">导出学习数据</button>
                    <button onclick="document.getElementById('importLearningFile').click()">导入学习数据</button>
                    <button onclick="closeStatsModal()">关闭</button>
                </div>
            </div>
        </div>
        <input type="file" id="importLearningFile" accept=".json" style="display:none" onchange="importLearningData(event)">
    `;
    
    document.body.insertAdjacentHTML('beforeend', statsHtml);
}

// 关闭统计模态框
function closeStatsModal() {
    const modal = document.querySelector('.stats-modal');
    if (modal) modal.remove();
}

// 导入学习数据
async function importLearningData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const message = await enhancedDict.importLearningData(file);
        alert(message);
        closeStatsModal();
    } catch (err) {
        alert('导入失败: ' + err);
    }
}

// 查找相似词汇
function findSimilarWords(word) {
    const similar = [];
    const wordLower = word.toLowerCase();
    
    // 在本地词典中查找相似词汇
    for (const [w, data] of Object.entries(wordDatabase)) {
        if (w !== wordLower && (w.includes(wordLower) || wordLower.includes(w))) {
            similar.push({ word: w, data });
        }
    }
    
    // 基于词根查找相似词汇
    const currentData = wordDatabase[wordLower];
    if (currentData && currentData.roots) {
        const currentRoots = currentData.roots
            .filter(r => r && r.root)
            .map(r => r.root.replace(/[-]/g, ''));
        
        for (const [w, data] of Object.entries(wordDatabase)) {
            if (w !== wordLower && data.roots) {
                const hasCommonRoot = data.roots.some(r => 
                    r && r.root && currentRoots.includes(r.root.replace(/[-]/g, ''))
                );
                if (hasCommonRoot && !similar.find(s => s.word === w)) {
                    similar.push({ word: w, data });
                }
            }
        }
    }
    
    displaySimilarWords(similar.slice(0, 10), word);
}

// 显示相似词汇
function displaySimilarWords(similar, originalWord) {
    if (similar.length === 0) {
        alert('未找到相似词汇');
        return;
    }
    
    const similarHtml = `
        <div class="similar-modal">
            <div class="similar-content">
                <h3>与 "${originalWord}" 相似的词汇</h3>
                <div class="similar-list">
                    ${similar.map(s => `
                        <div class="similar-item" onclick="searchSimilarWord('${s.word}')">
                            <div class="similar-word">${s.word}</div>
                            ${s.data.gloss ? `<div class="similar-gloss">${s.data.gloss.substring(0, 100)}...</div>` : ''}
                            ${s.data.roots ? `
                                <div class="similar-roots">
                                    ${s.data.roots.slice(0, 3).map(r => `<span class="similar-root">${r.root}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <button onclick="closeSimilarModal()">关闭</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', similarHtml);
}

// 搜索相似词汇
function searchSimilarWord(word) {
    closeSimilarModal();
    document.getElementById('searchInput').value = word;
    search();
}

// 关闭相似词汇模态框
function closeSimilarModal() {
    const modal = document.querySelector('.similar-modal');
    if (modal) modal.remove();
}

// 搜索相关词汇
function searchRelatedWord(word) {
    document.getElementById('searchInput').value = word;
    search();
}

// 显示词根树
async function showRootTree(word) {
    const container = document.getElementById('rootTreeContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">正在生成词根树...</div>';
    container.style.display = 'block';
    
    try {
        if (typeof AIRootAnalyzer !== 'undefined' && AIRootAnalyzer.generateRootTree) {
            const treeData = await AIRootAnalyzer.generateRootTree(word);
            if (treeData && treeData.tree) {
                displayRootTree(treeData.tree);
            } else {
                container.innerHTML = '<div class="error">无法生成词根树</div>';
            }
        } else {
            container.innerHTML = '<div class="error">请先设置AI功能</div>';
        }
    } catch (error) {
        container.innerHTML = '<div class="error">生成词根树失败</div>';
        console.error('词根树错误:', error);
    }
}

// 显示词根树结构
function displayRootTree(tree) {
    const container = document.getElementById('rootTreeContainer');
    
    const treeHtml = `
        <div class="root-tree">
            <div class="tree-title">🌳 ${tree.word} 词根树</div>
            <div class="tree-content">
                <div class="target-word">${tree.word}</div>
                <div class="tree-branches">
                    ${tree.roots.map(rootInfo => `
                        <div class="tree-branch">
                            <div class="root-node">
                                <span class="root-text">${rootInfo.root}</span>
                                <span class="root-meaning">${rootInfo.meaning}</span>
                            </div>
                            <div class="related-words">
                                ${rootInfo.relatedWords.map(relWord => 
                                    `<span class="related-word-item" onclick="searchRelatedWord('${relWord}')">${relWord}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button onclick="hideRootTree()" class="close-tree-btn">关闭</button>
        </div>
    `;
    
    container.innerHTML = treeHtml;
}

// 隐藏词根树
function hideRootTree() {
    const container = document.getElementById('rootTreeContainer');
    if (container) {
        container.style.display = 'none';
    }
}
