# Build all smart contracts

Write-Host 'Building SecretSwap contracts...'
Set-Location contracts/secretswap
cargo build --release --target wasm32-unknown-unknown
Set-Location ../..

Write-Host 'Building Aggregator contract...'
Set-Location contracts/aggregator
cargo build --release --target wasm32-unknown-unknown
Set-Location ../..

Write-Host 'All contracts built successfully!'