// 增强的词根分析器 - 精简版（仅算法，数据由 comprehensive_roots.js 提供）
const EnhancedRootAnalyzer = {
    // 数据容器（由 comprehensive_roots.js 填充）
    prefixes: {},
    suffixes: {},
    roots: {},
    
    // 特殊词汇处理（核心功能保留）
    specialWords: {
        "decipher": [
            { root: "de-", meaning: "去除，向下" },
            { root: "cipher", meaning: "密码，零" }
        ],
        "asparagus": [
            { root: "aspar", meaning: "芦笋" },
            { root: "ag", meaning: "做，驱动" },
            { root: "-us", meaning: "名词后缀" }
        ],
        "misunderstand": [
            { root: "mis-", meaning: "错误，坏" },
            { root: "under-", meaning: "在...下" },
            { root: "stand", meaning: "站立，理解" }
        ]
    },
    
    // 主要分析函数
    analyze(word) {
        const wordLower = word.toLowerCase();
        
        // 检查特殊词汇
        if (this.specialWords[wordLower]) {
            return this.specialWords[wordLower];
        }
        
        // 进行智能分析
        return this.intelligentAnalyze(wordLower);
    },
    
    // 带AI增强的分析函数
    async analyzeWithAI(word) {
        const wordLower = word.toLowerCase();
        
        // 先用本地分析
        const localResult = this.analyze(wordLower);
        
        // 判断是否需要AI增强
        if (this.shouldUseAI(localResult) && typeof AIRootAnalyzer !== 'undefined') {
            try {
                const aiResult = await AIRootAnalyzer.analyzeWithAI(wordLower);
                if (aiResult && aiResult.length > 0) {
                    return { result: aiResult, source: 'AI' };
                }
            } catch (error) {
                console.log('AI分析失败，使用本地结果:', error.message);
            }
        }
        
        return { result: localResult, source: 'local' };
    },
    
    // 判断是否需要AI分析
    shouldUseAI(result) {
        return result.length <= 2 && 
               result.some(r => r.meaning === '词根' || r.meaning === '词根片段');
    },
    
    // 智能分析算法
    intelligentAnalyze(word) {
        // 0. 检查是否为完整借词（不应分割）
        if (this.isIntactWord(word)) {
            return [{ root: word, meaning: "完整词根" }];
        }
        
        // 1. 优先检查完整复合词
        const compoundResult = this.analyzeCompound(word);
        if (compoundResult.length > 1) {
            return compoundResult;
        }
        
        const components = [];
        let remaining = word;
        
        // 2. 检测前缀
        const prefixResult = this.detectPrefix(remaining);
        if (prefixResult) {
            components.push(prefixResult.component);
            remaining = prefixResult.remaining;
            
            // 前缀后再次检查复合词
            const postPrefixCompound = this.analyzeCompound(remaining);
            if (postPrefixCompound.length > 1) {
                components.push(...postPrefixCompound);
                return components;
            }
        }
        
        // 3. 检测后缀
        const suffixResult = this.detectSuffix(remaining);
        let suffixComponent = null;
        if (suffixResult) {
            suffixComponent = suffixResult.component;
            remaining = suffixResult.remaining;
        }
        
        // 4. 处理词根（优化匹配）
        if (remaining) {
            const rootComponents = this.analyzeRootOptimized(remaining);
            components.push(...rootComponents);
        }
        
        // 5. 添加后缀
        if (suffixComponent) {
            components.push(suffixComponent);
        }
        
        return components.length > 0 ? components : [{ root: word, meaning: "词根" }];
    },
    
    // 检测前缀
    detectPrefix(word) {
        for (const [prefix, meaning] of Object.entries(this.prefixes)) {
            const prefixClean = prefix.replace('-', '');
            if (word.startsWith(prefixClean) && word.length > prefixClean.length) {
                return {
                    component: { root: prefix, meaning: meaning },
                    remaining: word.substring(prefixClean.length)
                };
            }
        }
        return null;
    },
    
    // 检测后缀
    detectSuffix(word) {
        for (const [suffix, meaning] of Object.entries(this.suffixes)) {
            const suffixClean = suffix.replace('-', '');
            if (word.endsWith(suffixClean) && word.length > suffixClean.length) {
                return {
                    component: { root: suffix, meaning: meaning },
                    remaining: word.substring(0, word.length - suffixClean.length)
                };
            }
        }
        return null;
    },
    
    // 优化的词根分析（避免过度分割）
    analyzeRootOptimized(word) {
        // 直接匹配
        if (this.roots[word]) {
            return [{ root: word, meaning: this.roots[word] }];
        }
        
        // 找到最佳匹配（最长且有意义的词根）
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [root, meaning] of Object.entries(this.roots)) {
            if (word.includes(root) && root.length >= 3) {
                // 评分：长度 + 意义性
                const score = root.length + (meaning !== '词根' ? 2 : 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { root, meaning, index: word.indexOf(root) };
                }
            }
        }
        
        if (bestMatch) {
            const components = [];
            const { root, meaning, index } = bestMatch;
            
            // 前面部分
            if (index > 0) {
                const before = word.substring(0, index);
                if (before.length >= 3) {
                    const beforeComponents = this.analyzeRootOptimized(before);
                    components.push(...beforeComponents);
                } else {
                    components.push({ root: before, meaning: "词根片段" });
                }
            }
            
            // 匹配的词根
            components.push({ root, meaning });
            
            // 后面部分
            if (index + root.length < word.length) {
                const after = word.substring(index + root.length);
                if (after.length >= 3) {
                    const afterComponents = this.analyzeRootOptimized(after);
                    components.push(...afterComponents);
                } else {
                    components.push({ root: after, meaning: "词根片段" });
                }
            }
            
            return components;
        }
        
        // 音节分割
        return this.syllableSegmentation(word);
    },
    
    // 分析复合词（智能识别）
    analyzeCompound(word) {
        // 常见复合词模式
        const patterns = [
            // 前缀 + 复合词
            { pattern: /^(under|over|out|up|down|with|through)(stand|come|go|take|put|draw|flow|look)$/, 
              handler: (match) => [
                { root: match[1] + "-", meaning: this.getPrefixMeaning(match[1]) },
                { root: match[2], meaning: this.getRootMeaning(match[2]) }
              ]
            },
            // 简单复合词
            { pattern: /^(any|some|every|no)(thing|body|one|where)$/, 
              handler: (match) => [
                { root: match[1], meaning: "限定词" },
                { root: match[2], meaning: "名词部分" }
              ]
            }
        ];
        
        for (const { pattern, handler } of patterns) {
            const match = word.match(pattern);
            if (match) {
                return handler(match);
            }
        }
        
        return [{ root: word, meaning: "词根" }];
    },
    
    // 获取前缀含义
    getPrefixMeaning(prefix) {
        const meanings = {
            'under': '在...下',
            'over': '在...上', 
            'out': '向外',
            'up': '向上',
            'down': '向下',
            'with': '与...一起',
            'through': '通过'
        };
        return meanings[prefix] || '前缀';
    },
    
    // 检查是否为完整词（基于语言学规律）
    isIntactWord(word) {
        // 基于词长和结构特征判断
        if (word.length <= 4) return false;
        
        // 拉丁借词特征：以-um, -us, -ium结尾
        if (/^[a-z]{4,}(um|us|ium)$/.test(word)) return true;
        
        // 希腊借词特征：包含ph, th, ch组合
        if (/^[a-z]{5,}$/.test(word) && /(ph|th|ch|gy|my)/.test(word)) return true;
        
        // 法语借词特征：以-ent, -ant结尾但不是形容词
        if (/^[a-z]{6,}(ent|ant)$/.test(word) && this.isNounNotAdjective(word)) return true;
        
        return false;
    },
    
    // 判断是否为名词而非形容词
    isNounNotAdjective(word) {
        // 基于语义和使用频率的启发式判断
        const nounIndicators = ['talent', 'parent', 'student', 'agent', 'client'];
        return nounIndicators.includes(word);
    },
    
    // 获取词根含义
    getRootMeaning(root) {
        const meanings = {
            'stand': '站立，理解',
            'come': '来',
            'go': '去',
            'take': '拿',
            'put': '放',
            'draw': '拉',
            'flow': '流',
            'look': '看'
        };
        return meanings[root] || '词根';
    },
    
    // 音节分割
    syllableSegmentation(word) {
        if (word.length <= 4) {
            return [{ root: word, meaning: "词根" }];
        }
        
        // 简单的音节分割
        const mid = Math.floor(word.length / 2);
        return [
            { root: word.substring(0, mid), meaning: "词根片段" },
            { root: word.substring(mid), meaning: "词根片段" }
        ];
    }
};

console.log('增强词根分析器（精简版）加载完成');