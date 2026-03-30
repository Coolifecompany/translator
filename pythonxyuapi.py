import requests
import json

def ask_ai(prompt, system_message="你是一个有用的助手"):
    # 1. 接口配置（已脱敏）
    url = 'https://xyuapi.top/v1/chat/completions'
    
    # 请在这里填入你的 API Key
    api_key = '在此处填入你的_API_KEY' 
    
    # 2. 设置请求头
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    # 3. 构造请求参数
    payload = {
        "model": "claude-opus-4-6-thinking", # 可以根据需要更换模型
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        "stream": True,  # 开启流式传输，体验更好
        "temperature": 0.7,
        "top_p": 1
    }

    try:
        # 4. 发送请求
        response = requests.post(url, headers=headers, json=payload, stream=True)
        
        if response.status_code != 200:
            print(f"请求失败，状态码: {response.status_code}")
            return

        # 5. 解析流式返回的数据
        for line in response.iter_lines():
            if line:
                # 去掉 "data: " 前缀
                line_str = line.decode('utf-8')
                if line_str.startswith("data: "):
                    content = line_str[6:]
                    
                    if content.strip() == "[DONE]":
                        break
                    
                    try:
                        data_json = json.loads(content)
                        delta = data_json["choices"][0].get("delta", {})
                        if "content" in delta:
                            # 实时打印内容
                            print(delta["content"], end="", flush=True)
                    except:
                        continue
        print("\n")

    except Exception as e:
        print(f"发生错误: {e}")

# --- 使用示例 ---
if __name__ == "__main__":
    user_q = input("请输入你的问题: ")
    ask_ai(user_q)