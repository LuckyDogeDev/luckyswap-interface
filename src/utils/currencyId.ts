import { Currency, ETHER, Token } from '@luckyfinance/sdk'

export function currencyId(currency: Currency): string {
    if (currency === ETHER) return 'ETH'
    if (currency instanceof Token) return currency.address
    throw new Error('invalid currency')
}
