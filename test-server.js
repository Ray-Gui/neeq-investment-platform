import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 8080;

// 提供静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 路由：所有未匹配的路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ 测试服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 测试 SPA 路由:`);
  console.log(`   - http://localhost:${PORT}/`);
  console.log(`   - http://localhost:${PORT}/bse`);
  console.log(`   - http://localhost:${PORT}/neeq`);
  console.log(`   - http://localhost:${PORT}/financial`);
  console.log(`   - http://localhost:${PORT}/scoring`);
});
