export const LOGIN_USERNAME_MAX_LENGTH = 120;
export const LOGIN_PASSWORD_MAX_LENGTH = 256;

export function parseLoginPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: '登录请求体必须是 JSON 对象' };
  }

  const allowedKeys = new Set(['username', 'password']);
  const unknownKeys = Object.keys(body)
    .filter((key) => !allowedKeys.has(key))
    .sort();
  if (unknownKeys.length > 0) {
    return { error: `不支持的登录字段：${unknownKeys.join(', ')}` };
  }

  if (typeof body.username !== 'string' || body.username.trim().length === 0) {
    return { error: '用户名必须是非空字符串' };
  }

  const username = body.username.trim();
  if (username.length > LOGIN_USERNAME_MAX_LENGTH) {
    return { error: `用户名不能超过 ${LOGIN_USERNAME_MAX_LENGTH} 个字符` };
  }

  if (typeof body.password !== 'string' || body.password.length === 0) {
    return { error: '密码必须是非空字符串' };
  }

  if (body.password.length > LOGIN_PASSWORD_MAX_LENGTH) {
    return { error: `密码不能超过 ${LOGIN_PASSWORD_MAX_LENGTH} 个字符` };
  }

  return {
    value: {
      username,
      password: body.password
    }
  };
}
