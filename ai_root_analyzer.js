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
        
        const prompt = `Please analyze the English word "${word}" and provide:
1. Root/prefix/suffix breakdown with Chinese meanings
2. Etymology and historical origin
3. Related words

Return JSON format:
{
  "roots": [{"root": "dis-", "meaning": "分离，相反"}, {"root": "embark", "meaning": "登船"}],
  "etymology": "1580年代，源自法语desembarquer，意为'从船上卸货'...",
  "related": ["disembarkation", "disembarked"]
}

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
                    max_tokens: 400,
                    temperature: 0.1,
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