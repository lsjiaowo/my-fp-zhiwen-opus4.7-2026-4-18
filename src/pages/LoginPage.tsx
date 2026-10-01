import { useState } from 'react';
import { Card, Form, Input, Button, Alert, Space, Typography, Modal, Tooltip } from 'antd';
import {
  UserOutlined, LockOutlined, LoginOutlined,
  CloudServerOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../lib/authContext';
import { getServerUrl, setServerUrl, ping, AuthError } from '../lib/authClient';


export default function LoginPage() {
  const { login, state } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [serverUrl, setServerUrlState] = useState(getServerUrl());
  const [pingResult, setPingResult] = useState<{ ok: boolean; ms: number; msg: string } | null>(null);

  const reasonHint = state.status === 'unauthenticated' ? state.reason : null;

  const handleLogin = async (values: { username: string; password: string }) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await login(values.username.trim(), values.password);
      // AuthProvider state change will redirect automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };


  const handlePing = async () => {
    setPingResult(null);
    const t0 = performance.now();
    try {
      // Apply temp server url for ping
      const before = getServerUrl();
      setServerUrl(serverUrl);
      try {
        const r = await ping();
        const ms = Math.round(performance.now() - t0);
        setPingResult({ ok: true, ms, msg: `连接成功，服务器时间 ${new Date(r.time).toLocaleString()}` });
      } finally {
        // Restore previous URL until user clicks save
        setServerUrl(before);
      }
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      const msg = err instanceof AuthError ? err.message : (err as Error).message;
      setPingResult({ ok: false, ms, msg });
    }
  };

  const handleSaveServer = () => {
    setServerUrl(serverUrl);
    setServerModalOpen(false);
  };

  return (
    <div className="login-shell">
      <div className="login-bg" />
      <Card className="login-card" bordered={false}>
        <div className="login-brand">
          <div className="login-brand-mark">天胡</div>
          <div>
            <div className="login-brand-title">天胡6金</div>
            <div className="login-brand-sub">登录后开始管理你的多账号矩阵</div>
          </div>
        </div>

        {reasonHint && (
          <Alert
            type="warning"
            showIcon
            message={reasonHint}
            style={{ marginBottom: 12 }}
            closable
          />
        )}
        {error && (
          <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} closable onClose={() => setError(null)} />
        )}
        {success && (
          <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} closable onClose={() => setSuccess(null)} />
        )}

        <Form layout="vertical" onFinish={handleLogin} requiredMark={false} disabled={busy}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={busy} icon={<LoginOutlined />}>
            登录
          </Button>
          <Alert
            type="info"
            showIcon
            message="Personal Self-Hosted 个人版仅使用已创建的唯一账号登录；客户端不开放注册。"
            style={{ marginTop: 12 }}
          />
        </Form>

        <div className="login-footer">
          <Space split={<span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>}>
            <Tooltip title="切换 / 测试服务器地址">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => { setServerUrlState(getServerUrl()); setPingResult(null); setServerModalOpen(true); }}
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                <CloudServerOutlined /> {getServerUrl()}
              </Button>
            </Tooltip>
            <Typography.Text type="secondary" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              v0.1.0
            </Typography.Text>
          </Space>
        </div>
      </Card>

      <Modal
        title="服务器设置"
        open={serverModalOpen}
        onCancel={() => setServerModalOpen(false)}
        onOk={handleSaveServer}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="服务器地址" extra="填写你的 Personal Self-Hosted 服务器地址，不需要尾部斜杠">
            <Input
              value={serverUrl}
              onChange={(e) => setServerUrlState(e.target.value)}
              addonBefore={<CloudServerOutlined />}
              placeholder="http://host:port"
            />
          </Form.Item>
          <Space>
            <Button onClick={handlePing}>测试连接</Button>
            <Button onClick={() => setServerUrlState(getServerUrl())}>恢复当前</Button>
          </Space>
          {pingResult && (
            <Alert
              type={pingResult.ok ? 'success' : 'error'}
              showIcon
              style={{ marginTop: 12 }}
              message={`${pingResult.msg}（${pingResult.ms} ms）`}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
}
