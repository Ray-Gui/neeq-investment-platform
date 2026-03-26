import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordProtectProps {
  onUnlock: () => void;
}

export default function PasswordProtect({ onUnlock }: PasswordProtectProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 模拟验证延迟
    setTimeout(() => {
      // 密码验证（生产环境应该通过后端验证）
      const correctPassword = "neeq2025"; // 默认密码
      
      if (password === correctPassword) {
        // 保存到 localStorage，避免重复输入
        localStorage.setItem("app_unlocked", "true");
        onUnlock();
      } else {
        setError("密码错误，请重试");
        setPassword("");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">投资研究平台</h1>
          <p className="text-gray-400">新三板做市商投资决策支持系统</p>
        </div>

        {/* Password Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                访问密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="请输入访问密码"
                  className="w-full bg-slate-700 text-white px-4 py-3 pr-12 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none transition-colors"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  解锁访问
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-gray-400 text-center">
              💡 <strong>提示：</strong>默认密码为 <code className="bg-slate-900 px-2 py-1 rounded">neeq2025</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2026 新三板做市商投资研究平台 · 保密信息
          </p>
        </div>
      </div>
    </div>
  );
}
