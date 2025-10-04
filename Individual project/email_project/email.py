import pandas as pd
from tqdm import tqdm

# 可修改的参数
TOP_X_NODES = 100

# 步骤1: 创建a.csv文件，初始化节点度数统计
print("Step 1: Initializing a.csv and counting node degrees...")

# 首先读取email-Eu-core-temporal.txt获取所有节点
nodes = set()
with open('email-Eu-core-temporal.txt', 'r') as f:
    for line in tqdm(f, desc="Reading nodes"):
        parts = line.strip().split()
        if len(parts) >= 2:
            a, b = int(parts[0]), int(parts[1])
            nodes.add(a)
            nodes.add(b)

# 创建初始的a.csv
max_node = max(nodes)
min_node = min(nodes)
node_degrees = {i: 0 for i in range(min_node, max_node + 1)}

# 读取文件并统计度数
with open('email-Eu-core-temporal.txt', 'r') as f:
    for line in tqdm(f, desc="Counting degrees"):
        parts = line.strip().split()
        if len(parts) >= 2:
            a, b = int(parts[0]), int(parts[1])
            node_degrees[a] += 1
            node_degrees[b] += 1

# 创建DataFrame并保存
df_a = pd.DataFrame(list(node_degrees.items()), columns=['node', 'degree'])
df_a = df_a.sort_values('degree', ascending=False).reset_index(drop=True)
df_a.to_csv('a.csv', index=False)
print(f"a.csv created with {len(df_a)} nodes, sorted by degree (descending)")

# 步骤2: 获取前x个节点
top_nodes = set(df_a.head(TOP_X_NODES)['node'].tolist())
print(f"\nStep 2: Selected top {TOP_X_NODES} nodes: {sorted(top_nodes)}")

# 步骤3: 创建processed_email_data.csv
print("\nStep 3: Creating processed_email_data.csv...")

edge_dict = {}

with open('email-Eu-core-temporal.txt', 'r') as f:
    for line in tqdm(f, desc="Processing edges"):
        parts = line.strip().split()
        if len(parts) >= 2:
            a, b = int(parts[0]), int(parts[1])

            # 检查a和b是否都在前x个节点中
            if a in top_nodes and b in top_nodes:
                edge_key = (a, b)
                if edge_key in edge_dict:
                    edge_dict[edge_key] += 1
                else:
                    edge_dict[edge_key] = 1

# 创建processed_email_data.csv，在节点编号前加上"用户"前缀
processed_email_data = []
for (source, target), value in edge_dict.items():
    processed_email_data.append({
        'source': f'用户{source}',
        'target': f'用户{target}',
        'value': value
    })

df_processed_email_data = pd.DataFrame(processed_email_data)
df_processed_email_data.to_csv('processed_email_data.csv', index=False)
print(f"processed_email_data.csv created with {len(df_processed_email_data)} unique edges")

print("\nAll tasks completed successfully!")
print(f"- a.csv: {len(df_a)} nodes sorted by degree")
print(f"- processed_email_data.csv: {len(df_processed_email_data)} edges between top {TOP_X_NODES} nodes")