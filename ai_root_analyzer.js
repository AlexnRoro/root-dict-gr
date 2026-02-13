// AI词根分析器 - 使用Groq API
const AIRootAnalyzer = {
    // Groq API配置
    apiKey: '', // 需要用户设置
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-8b-8192',
    
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
    
    // AI分析词根
    async analyzeWithAI(word) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('请先设置Groq API密钥');
        }
        
        const prompt = `分析英语单词"${word}"的词根构成。请返回JSON格式的数组，每个元素包含root（词根）和meaning（中文含义）。
        
示例格式：[{"root": "pre-", "meaning": "前，预先"}, {"root": "dict", "meaning": "说，预言"}, {"root": "-ion", "meaning": "名词后缀"}]

只返回JSON数组，不要其他解释文字。`;
        
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
                    max_tokens: 300,
                    temperature: 0.1
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices[0].message.content.trim();
            
            return this.parseAIResponse(content);
        } catch (error) {
            console.error('Groq API调用失败:', error);
            throw error;
        }
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
            await this.analyzeWithAI('test');
            return true;
        } catch (error) {
            return false;
        } finally {
            this.apiKey = tempKey;
        }
    }
};

console.log('AI词根分析器加载完成');