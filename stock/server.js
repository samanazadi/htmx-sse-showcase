const http = require('node:http');

const PORT = process.env.PORT || 8080;
const INTERVAL_MS = 1500;

const stocks = [
    {symbol: 'GOOG', name: 'Alphabet Inc', open: 345.10},
    {symbol: 'AAPL', name: 'Apple Inc', open: 333.20},
    {symbol: 'MSFT', name: 'Microsoft Corp', open: 529.20},
];
for (const s of stocks) s.price = s.open;

function tick() {
    for (const s of stocks) {
        s.price = Math.max(0.01, s.price * (1 + (Math.random() - 0.5) / 100));
    }
}

function partial(s) {
    const change = ((s.price - s.open) / s.open) * 100;
    const up = change >= 0;
    const arrow = up ? '↑' : '↓';
    return `<hx-partial hx-target="#company-${s.symbol}">
    <td>${s.symbol}</td>
    <td>${s.name}</td>
    <td>${s.price.toFixed(2)}</td>
    <td class="${up ? 'up' : 'down'}">${arrow} ${Math.abs(change).toFixed(2)}%</td>
</hx-partial>`;
}

function sseMessage(html) {
    return html.split('\n').map(line => `data: ${line}`).join('\n') + '\n\n';
}

const clients = new Set();

setInterval(() => {
    tick();
    const msg = sseMessage(stocks.map(partial).join('\n'));
    for (const res of clients) res.write(msg);
}, INTERVAL_MS);

http.createServer((req, res) => {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
    });
    res.write('retry: 3000\n\n');
    res.write(sseMessage(stocks.map(partial).join('\n')));
    clients.add(res);
    req.on('close', () => clients.delete(res));
}).listen(PORT, () => console.log(`Stock SSE on http://localhost:${PORT}/stocks`));
