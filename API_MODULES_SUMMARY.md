# API 模块文件清单

## 新增文件列表

1. **src/api/providers.js** - Providers 管理 API
2. **src/api/providerCapabilities.js** - Provider Capabilities 管理 API
3. **src/api/providerKeys.js** - Provider API Keys 管理 API
4. **src/api/routingPolicies.js** - Routing Policies 管理 API

## 导出的函数清单

### 1. providers.js

| 函数名 | HTTP 方法 | 路径 | 说明 |
|--------|-----------|------|------|
| `listProviders()` | GET | `/api/v1/admin/providers` | 获取提供商列表 |
| `createProvider(data)` | POST | `/api/v1/admin/providers` | 创建提供商 |
| `updateProvider(providerId, data)` | PUT | `/api/v1/admin/providers/{providerId}` | 更新提供商 |

**使用示例**:
```javascript
import { listProviders, createProvider, updateProvider } from '@/api/providers'

// 获取列表
const response = await listProviders()

// 创建
await createProvider({ code: 'aliyun', name: '阿里云', status: 'ACTIVE' })

// 更新
await updateProvider(1, { name: '阿里云AI', status: 'ACTIVE' })
```

### 2. providerCapabilities.js

| 函数名 | HTTP 方法 | 路径 | 说明 |
|--------|-----------|------|------|
| `listCapabilities(providerId)` | GET | `/api/v1/admin/providers/{providerId}/capabilities` | 获取提供商能力列表 |
| `createCapability(providerId, data)` | POST | `/api/v1/admin/providers/{providerId}/capabilities` | 创建提供商能力 |
| `updateCapability(providerId, capabilityId, data)` | PUT | `/api/v1/admin/providers/{providerId}/capabilities/{capabilityId}` | 更新提供商能力 |

**使用示例**:
```javascript
import { listCapabilities, createCapability, updateCapability } from '@/api/providerCapabilities'

// 获取列表
const response = await listCapabilities(1)

// 创建
await createCapability(1, {
  capability: 'segmentation',
  endpoint: 'https://api.example.com/seg',
  priority: 100,
  defaultTimeoutMs: 8000
})

// 更新
await updateCapability(1, 10, { priority: 50, status: 'ACTIVE' })
```

### 3. providerKeys.js

| 函数名 | HTTP 方法 | 路径 | 说明 |
|--------|-----------|------|------|
| `listKeys(providerId)` | GET | `/api/v1/admin/providers/{providerId}/keys` | 获取提供商API密钥列表 |
| `createKey(providerId, data)` | POST | `/api/v1/admin/providers/{providerId}/keys` | 创建提供商API密钥（接收明文） |
| `disableKey(providerId, keyId)` | PUT | `/api/v1/admin/providers/{providerId}/keys/{keyId}/disable` | 禁用提供商API密钥 |

**使用示例**:
```javascript
import { listKeys, createKey, disableKey } from '@/api/providerKeys'

// 获取列表
const response = await listKeys(1)

// 创建（明文 apiKey 会被后端加密存储）
await createKey(1, {
  name: 'Production Key',
  apiKey: 'sk-xxxxx',  // 明文
  status: 'ACTIVE'
})

// 禁用
await disableKey(1, 5)
```

### 4. routingPolicies.js

| 函数名 | HTTP 方法 | 路径 | 说明 |
|--------|-----------|------|------|
| `listPolicies(params)` | GET | `/api/v1/admin/routing-policies` | 获取路由策略列表（支持 query 参数） |
| `createPolicy(data)` | POST | `/api/v1/admin/routing-policies` | 创建路由策略 |
| `updatePolicy(policyId, data)` | PUT | `/api/v1/admin/routing-policies/{policyId}` | 更新路由策略 |

**使用示例**:
```javascript
import { listPolicies, createPolicy, updatePolicy } from '@/api/routingPolicies'

// 获取列表（支持查询参数）
const allPolicies = await listPolicies()
const globalPolicies = await listPolicies({ scope: 'GLOBAL' })
const merchantPolicies = await listPolicies({ 
  scope: 'MERCHANT', 
  merchantId: 1 
})
const capabilityPolicies = await listPolicies({ 
  capability: 'segmentation' 
})

// 创建
await createPolicy({
  scope: 'GLOBAL',
  capability: 'segmentation',
  preferProvidersJson: ['aliyun', 'volc'],
  maxCostTier: 2,
  status: 'ACTIVE'
})

// 更新
await updatePolicy(1, { 
  preferProvidersJson: ['aliyun', 'volc', 'local_sd'],
  maxCostTier: 3
})
```

## 技术说明

### 封装方式
- 所有 API 模块都从 `./http` 导入统一的 http 客户端
- http 客户端已配置：
  - `baseURL: '/api/v1'`
  - Token 拦截器（自动添加 `Authorization: Bearer {token}`）
  - 401 自动登出处理

### 函数命名规范
- `list*` - 获取列表（GET）
- `create*` - 创建资源（POST）
- `update*` - 更新资源（PUT）
- `disable*` - 禁用资源（PUT，特殊操作）

### 参数说明
- 路径参数通过模板字符串拼接（如 `providerId`, `capabilityId`）
- 查询参数通过 `{ params }` 对象传递（如 `listPolicies`）
- 请求体通过 `data` 对象传递

### 注意事项
1. **API Keys**: `createKey` 接收明文 `apiKey`，后端会自动加密存储，响应中不会返回明文
2. **查询参数**: `listPolicies` 支持可选参数 `scope`, `merchantId`, `capability`，可组合使用
3. **Token 认证**: 所有请求自动携带 token（通过 http 拦截器）
4. **错误处理**: 401 错误会自动登出并跳转登录页（通过 http 拦截器）
