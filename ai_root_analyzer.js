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
        
        const prompt = `Please provide a detailed etymological analysis of the English word "${word}" ONLY. Do not confuse it with other words.

Provide:
1. Root/prefix/suffix breakdown with Chinese meanings
2. DETAILED etymology including: original language, century of entry, intermediate forms, semantic evolution, and cultural context
3. Related words derived from "${word}"

Return JSON format:
{
  "roots": [{"root": "de-", "meaning": "去除，向下"}, {"root": "cipher", "meaning": "密码，暗号"}],
  "etymology": "详细词源：14世纪中期进入英语，源自古法语'deschiffrer'（意为'解读秘密文字'），该词由'des-'（表示逆转）+ 'chiffrer'（加密）构成。'chiffrer'本身来自阿拉伯语'sifr'（零，空），通过中世纪拉丁语'cifra'传入。最初专指解读数学密码，16世纪扩展为解读任何秘密信息，现代英语中进一步引申为'理解复杂事物'。在密码学发展史上，该词见证了从简单替换密码到现代加密技术的演进。",
  "related": ["deciphering", "deciphered", "decipherment", "cipher"]
}

IMPORTANT: 
- Focus ONLY on "${word}"
- Provide rich historical and linguistic details
- Include semantic evolution and cultural context
- Mention intermediate language forms if relevant
Only return the JSON object, no other text.`;
        
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
                    temperature: 0.03,
                    stream: false
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
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    roots: parsed.roots || [],
                    etymology: parsed.etymology || '',
                    related: parsed.related || []
                };
            }
        } catch (e) {
            console.error('解析AI响应失败:', e);
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