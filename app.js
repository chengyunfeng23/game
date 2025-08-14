const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// 配置参数
const config = {
    inputFiles: [
        './js/程云风游戏引擎1.0.0.js',    // 本地JS文件1
    ],
    outputDir: './dist/js',    // 输出目录
    outputFileName: 'bundle.min.js' // 输出文件名
};

// 确保输出目录存在
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
}

// 读取并合并所有输入文件
async function compileAndMinify() {
    try {
        // 读取所有JS文件内容
        let combinedCode = '';
        for (const file of config.inputFiles) {
            if (fs.existsSync(file)) {
                combinedCode += fs.readFileSync(file, 'utf8') + '\n';
                console.log(`已读取文件: ${file}`);
            } else {
                console.warn(`警告: 文件不存在 - ${file}`);
            }
        }

        // 压缩代码
        const minified = await minify(combinedCode, {
            compress: {
                drop_console: true,  // 移除console语句
                drop_debugger: true  // 移除debugger语句
            },
            mangle: true,          // 混淆变量名
            format: {
                comments: false      // 移除注释
            }
        });

        // 准备输出路径
        const outputPath = path.join(config.outputDir, config.outputFileName);
        ensureDirectoryExistence(outputPath);

        // 写入压缩后的文件
        fs.writeFileSync(outputPath, minified.code, 'utf8');
        console.log(`压缩完成！输出路径: ${outputPath}`);

    } catch (error) {
        console.error('压缩过程出错:', error);
    }
}

// 执行压缩
compileAndMinify();
