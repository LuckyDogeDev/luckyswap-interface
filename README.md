# LuckyFinance Interface

[![Styled With Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

An open source interface for LuckySwap -- a protocol for decentralized exchange of Ethereum tokens.

- Website: [luckydoge.finance](https://luckydoge.finance/)
- Interface: [app.luckydoge.finance](https://app.luckydoge.finance)
- Docs: [luckyfinance.gitbook.io](https://luckyfinance.gitbook.io)
- Twitter: [@LuckySwap](https://twitter.com/LuckyFinance)
- Reddit: [/r/LuckySwap](https://www.reddit.com/r/LuckySwap)
- Discord: [LuckySwap](https://discord.gg/Y7TF6QA)

## Accessing the LuckyFinance Interface

To access the Luckyswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/LuckyDogeDoge/luckyswap-interface/releases/latest),
or visit [app.luckydoge.finance](https://app.luckydoge.finance).

## Listing a token

Please see the
[@luckyfinance/default-token-list](https://github.com/LuckyDogeDev/default-token-list)
repository.

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

Note that the interface only works on networks where both
[(Uni|GoldNugget)swap V2](https://github.com/sushiswap/LuckyDogeDev/tree/master/contracts/uniswapv2) and
[multicall](https://github.com/makerdao/multicall) are deployed.
The interface will not work on other networks.

## Contributions

**Please open all pull requests against the `master` branch.**
CI checks will run against all PRs.
