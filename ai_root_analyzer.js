// AI词根分析器 - 使用Groq API
const AIRootAnalyzer = {
    // Groq API配置
    apiKey: '', // 需要用户设置
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    
    // 设置API密钥
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('groq_api_key', key);
    },
    
    // 获取API密钥
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem('groq_api_key') || '';
        }
        return this.apiKey;
    },
    
    // AI分析词根（增强版，包含词源典故）
    async analyzeWithAI(word) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('请先设置Groq API密钥');
        }
        
        const prompt = `Analyze ONLY the English word: "${word}"

Do NOT analyze any other words. Focus exclusively on: "${word}"

Provide:
1. Root/prefix/suffix breakdown with Chinese meanings for "${word}"
2. Complete etymology of "${word}" including: original language, century, intermediate forms, semantic evolution
3. Related words derived from "${word}"

Return JSON format:
{
  "roots": [{"root": "etymo-", "meaning": "真实的，词源"}, {"root": "-logy", "meaning": "学科，研究"}],
  "etymology": "详细词源：'etymology'一词源自古希腊语'etymologia'，由'etymos'（真实的，真正的）和'logos'（词语，研究）组成。该词在14世纪通过拉丁语'etymologia'进入英语，最初指对词汇真实含义的研究。在古希腊，哲学家们认为通过追溯词汇的原始形式可以发现事物的本质。现代语言学中，词源学成为历史语言学的重要分支，研究词汇的历史发展和语言间的借用关系。",
  "related": ["etymological", "etymologist", "etymologize"]
}

CRITICAL: Analyze ONLY "${word}". Do not use information from previous queries.
Return only the JSON object.`;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000,
                    temperature: 0.01,
                    stream: false,
                    presence_penalty: 0.5
                })
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('API错误响应:', errorData);
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API响应格式错误');
            }
            
            const content = data.choices[0].message.content.trim();
            return this.parseEnhancedResponse(content);
        } catch (error) {
            console.error('Groq API调用失败:', error);
            throw error;
        }
    },
    
    // 解析增强版AI响应
    parseEnhancedResponse(response) {
        console.log('AI原始响应:', response);
        
        try {
            // 先尝试直接解析
            const parsed = JSON.parse(response);
            return {
                roots: parsed.roots || [],
                etymology: parsed.etymology || '',
                related: parsed.related || []
            };
        } catch (e1) {
            try {
                // 提取JSON对象
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    // 清理JSON字符串，修复常见错误
                    let jsonStr = jsonMatch[0]
                        .replace(/,\s*([}\]])/g, '$1')  // 移除末尾逗号
                        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":')  // 添加属性名引号
                        .replace(/:\s*([^"\[\{][^,}\]]*)/g, (match, value) => {
                            // 为未加引号的字符串值添加引号
                            const trimmed = value.trim();
                            if (trimmed && !trimmed.match(/^[\d\[\{]/) && !trimmed.startsWith('"')) {
                                return ': "' + trimmed + '"';
                            }
                            return match;
                        });
                    
                    const parsed = JSON.parse(jsonStr);
                    return {
                        roots: parsed.roots || [],
                        etymology: parsed.etymology || '',
                        related: parsed.related || []
                    };
                }
            } catch (e2) {
                console.error('解析AI响应失败:', e2);
                console.log('尝试的JSON:', jsonMatch ? jsonMatch[0] : 'No match');
            }
        }
        
        // 回退到简单格式
        return this.parseAIResponse(response);
    },
    
    // 解析AI响应
    parseAIResponse(response) {
        try {
            // 直接解析JSON
            return JSON.parse(response);
        } catch {
            // 尝试提取JSON数组
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch {
                    // 如果还是失败，返回null
                    return null;
                }
            }
            return null;
        }
    },
    
    // AI生成词根树
    async generateRootTree(word) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('请先设置Groq API密钥');
        }
        
        const prompt = `Generate a root tree for the English word "${word}".

Create a hierarchical tree showing:
1. The target word at the top
2. Its immediate roots/components
3. Related words sharing the same roots
4. Etymology connections

Return JSON format:
{
  "tree": {
    "word": "${word}",
    "roots": [
      {
        "root": "root1",
        "meaning": "含义",
        "relatedWords": ["word1", "word2", "word3"]
      },
      {
        "root": "root2", 
        "meaning": "含义",
        "relatedWords": ["word4", "word5"]
      }
    ]
  }
}

Only return the JSON object.`;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 600,
                    temperature: 0.1,
                    stream: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices[0].message.content.trim();
            
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.error('解析词根树失败:', e);
            }
            
            return null;
        } catch (error) {
            console.error('生成词根树失败:', error);
            throw error;
        }
    },
    
    // AI分析相似词汇
    async findSimilarWords(word) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('请先设置Groq API密钥');
        }
        
        const prompt = `Find words similar to "${word}" based on:
1. Same root components
2. Similar meanings
3. Related etymology
4. Semantic relationships

Return 10-15 similar words with explanations.

Return JSON format:
{
  "similarWords": [
    {
      "word": "similar_word",
      "similarity": "shared root/meaning/etymology",
      "explanation": "why it's similar"
    }
  ]
}

Only return the JSON object.`;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 800,
                    temperature: 0.2,
                    stream: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices[0].message.content.trim();
            
            return this.parseSimilarWordsResponse(content);
        } catch (error) {
            console.error('AI相似词汇分析失败:', error);
            throw error;
        }
    },
    
    // 解析相似词汇响应
    parseSimilarWordsResponse(response) {
        console.log('AI相似词汇原始响应:', response);
        
        try {
            // 直接解析
            const parsed = JSON.parse(response);
            return parsed.similarWords || [];
        } catch (e1) {
            try {
                // 提取JSON对象
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    let jsonStr = jsonMatch[0];
                    
                    // 清理常见的JSON错误
                    jsonStr = jsonStr
                        .replace(/,\s*([}\]])/g, '$1')  // 移除末尾逗号
                        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":')  // 添加属性名引号
                        .replace(/:\s*([^"\[\{][^,}\]]*?)([,}\]])/g, (match, value, ending) => {
                            // 为未加引号的字符串值添加引号
                            const trimmed = value.trim();
                            if (trimmed && !trimmed.match(/^[\d\[\{]/) && !trimmed.startsWith('"')) {
                                return ': "' + trimmed.replace(/"/g, '\\"') + '"' + ending;
                            }
                            return match;
                        });
                    
                    const parsed = JSON.parse(jsonStr);
                    return parsed.similarWords || [];
                }
            } catch (e2) {
                console.error('解析相似词汇失败:', e2);
                console.log('尝试的JSON:', jsonMatch ? jsonMatch[0] : 'No match');
                
                // 最后尝试手动提取
                return this.extractSimilarWordsManually(response);
            }
        }
        
        return [];
    },
    
    // 手动提取相似词汇
    extractSimilarWordsManually(response) {
        const words = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            // 查找包含单词的行
            const wordMatch = line.match(/"word"\s*:\s*"([^"]+)"/i);
            const similarityMatch = line.match(/"similarity"\s*:\s*"([^"]+)"/i);
            const explanationMatch = line.match(/"explanation"\s*:\s*"([^"]+)"/i);
            
            if (wordMatch) {
                words.push({
                    word: wordMatch[1],
                    similarity: similarityMatch ? similarityMatch[1] : '相关',
                    explanation: explanationMatch ? explanationMatch[1] : '语义相关'
                });
            }
        }
        
        return words.slice(0, 15); // 限制数量
    },

    // 检查API密钥是否有效
    async testApiKey(key) {
        const tempKey = this.apiKey;
        this.apiKey = key;
        
        try {
            // 使用简单的测试请求
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('测试API密钥失败:', error);
            return false;
        } finally {
            this.apiKey = tempKey;
        }
    }
};

console.log('AI词根分析器加载完成');