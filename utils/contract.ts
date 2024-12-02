import { ethers } from "ethers";
import type { TransactionResponse } from "ethers";
import { useWalletClient } from 'wagmi';
import MemebankABI from "./memebank.json";
import DogeABI from "./doge.json";
import UsdtABI from "./usdt.json";
import OracleABI from "./oracle.json";

// Contract Addresses (replace with your actual addresses)
const MEMEBANK_ADDRESS = "0x193E4D13EA5Cc45159dcD196F7141ACE8c5d469D";
const USDT_ADDRESS = "0x394446a28172Caf28dc1BE293b40EE00b9997431";
const DOGE_ADDRESS = "0xf8Caee4D8EA86819E956c736ead0cBE2b587E9b5";
const ORACLE_ADDRESS = "0x78BE753961F94DD51335c44f3771519237139e6a";

interface ERC20Functions {
    approve(spender: string, value: bigint): Promise<TransactionResponse>;
    balanceOf(account: string): Promise<bigint>;
    allowance(owner: string, spender: string): Promise<bigint>;
    decimals(): Promise<number>;
}

interface UserData {
    collateralAmount: string;
    borrowedAmount: string;
    stableDeposited: string;
    collateralValue: string;
}

interface PlatformStats {
    totalDeposits: string;
    totalBorrowed: string;
    availableLiquidity: string;
    currentPrice: string;
    isEmergency: boolean;
    collateralRatio: string;
}

export class ContractService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;
    private memebankContract!: ethers.Contract;
    private usdtContract!: (ethers.Contract & ERC20Functions);
    private dogeContract!: (ethers.Contract & ERC20Functions);
    private oracleContract!: ethers.Contract;

    constructor() {
        if (typeof window !== 'undefined' && useWalletClient) {
            this.provider = new ethers.BrowserProvider(useWalletClient as any, {
                name: 'base-sepolia',
                chainId: 84532
            });
        }
    }

    private async initializeContracts() {
        if (!this.signer && this.provider) {
            this.signer = await this.provider.getSigner();
        }
        
        this.memebankContract = new ethers.Contract(MEMEBANK_ADDRESS, MemebankABI, this.signer);
        this.usdtContract = new ethers.Contract(USDT_ADDRESS, UsdtABI, this.signer) as ethers.Contract & ERC20Functions;
        this.dogeContract = new ethers.Contract(DOGE_ADDRESS, DogeABI, this.signer) as ethers.Contract & ERC20Functions;
        this.oracleContract = new ethers.Contract(ORACLE_ADDRESS, OracleABI, this.signer);
    }

    private async approveToken(
        tokenContract: ethers.Contract & ERC20Functions,
        amount: bigint,
        spender: string
    ) {
        const owner = await this.signer!.getAddress();
        const allowance = await tokenContract.allowance(owner, spender);
        
        if (allowance < amount) {
            const tx = await tokenContract.approve(spender, amount);
            await tx.wait();
        }
    }

    async depositCollateral(amount: string): Promise<TransactionResponse> {
        await this.initializeContracts();
        const amountEther = ethers.parseEther(amount);
        await this.approveToken(this.dogeContract, amountEther, MEMEBANK_ADDRESS);
        return await this.memebankContract.depositCollateral(amountEther);
    }

    async depositStable(amount: string): Promise<TransactionResponse> {
        await this.initializeContracts();
        const amountEther = ethers.parseEther(amount);
        await this.approveToken(this.usdtContract, amountEther, MEMEBANK_ADDRESS);
        return await this.memebankContract.depositStable(amountEther);
    }

    async borrowStablecoins(amount: string): Promise<TransactionResponse> {
        await this.initializeContracts();
        const amountEther = ethers.parseEther(amount);
        return await this.memebankContract.borrowStablecoins(amountEther);
    }

    async repayLoan(amount: string): Promise<TransactionResponse> {
        await this.initializeContracts();
        const amountEther = ethers.parseEther(amount);
        await this.approveToken(this.usdtContract, amountEther, MEMEBANK_ADDRESS);
        return await this.memebankContract.repayLoan(amountEther);
    }

    private async ensureContractsInitialized() {
        if (!this.signer || !this.memebankContract) {
            await this.initializeContracts();
        }
    }

    async getUserData(address: string): Promise<UserData> {
        try {
            await this.ensureContractsInitialized();
            
            const userData = await this.memebankContract.users(address);
            
            return {
                collateralAmount: ethers.formatEther(userData.collateralAmount || 0),
                borrowedAmount: ethers.formatEther(userData.borrowedAmount || 0),
                stableDeposited: ethers.formatEther(userData.stabledDeposited || 0),
                collateralValue: '0'
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return {
                collateralAmount: '0',
                borrowedAmount: '0',
                stableDeposited: '0',
                collateralValue: '0'
            };
        }
    }

    async getPlatformStats(): Promise<PlatformStats> {
        try {
            await this.ensureContractsInitialized();
            
            const [totalDeposits, price] = await Promise.all([
                this.memebankContract.totalStableDeposits(),
                this.oracleContract.getMemecoinPrice()
            ]);

            return {
                totalDeposits: ethers.formatEther(totalDeposits || 0),
                totalBorrowed: '0',
                availableLiquidity: '0',
                currentPrice: ethers.formatEther(price || 0),
                isEmergency: false,
                collateralRatio: '150'
            };
        } catch (error) {
            console.error('Error getting platform stats:', error);
            return {
                totalDeposits: '0',
                totalBorrowed: '0',
                availableLiquidity: '0',
                currentPrice: '0',
                isEmergency: false,
                collateralRatio: '150'
            };
        }
    }

    async getOraclePrice(): Promise<string> {
        try {
            await this.ensureContractsInitialized();
            const price = await this.oracleContract.getMemecoinPrice();
            const formattedPrice = ethers.formatUnits(price, 18);
            console.log('Oracle getPrice:', price, 'Formatted:', formattedPrice);
            return formattedPrice;
        } catch (error) {
            console.error('Error getting oracle price:', error);
            return '0';
        }
    }

    async getLendingInterestRate(): Promise<string> {
        await this.initializeContracts();
        const rate = await this.memebankContract.lendingInterestRate();
        return ethers.formatUnits(rate, 2);
    }

    async getBorrowInterestRate(): Promise<string> {
        await this.initializeContracts();
        const rate = await this.memebankContract.borrowInterestRate();
        return ethers.formatUnits(rate, 2);
    }

    async getCollateralizationRatio(): Promise<string> {
        await this.initializeContracts();
        const ratio = await this.memebankContract.collateralizationRatio();
        return ethers.formatUnits(ratio, 2);
    }

    async getFormattedRepaymentAmount(address: string) {
        try {
            await this.ensureContractsInitialized();
            
            const userData = await this.memebankContract.users(address);
            const borrowedAmount = BigInt(userData.borrowedAmount.toString());

            if (borrowedAmount === BigInt(0)) {
                return {
                    repaymentAmount: '0',
                    principal: '0',
                    interest: '0',
                    deadline: 0,
                    status: 'No active loan'
                };
            }

            const interest = await this.memebankContract.calculateInterest(address);
            const totalRepayment = borrowedAmount + BigInt(interest.toString());
            
            return {
                repaymentAmount: ethers.formatEther(totalRepayment),
                principal: ethers.formatEther(borrowedAmount),
                interest: ethers.formatEther(interest),
                deadline: Number(userData.borrowTimestamp) * 1000,
                status: borrowedAmount > 0 ? 'Active' : 'No active loan'
            };
        } catch (error) {
            console.error('Error getting repayment details:', error);
            return {
                repaymentAmount: '0',
                principal: '0',
                interest: '0',
                deadline: 0,
                status: 'No active loan'
            };
        }
    }

    async connectWallet(): Promise<{ address: string; network: { name: string; chainId: number } }> {
        if (!this.provider) throw new Error("Provider not initialized");
        
        // Request account access
        await window.ethereum?.request({ method: 'eth_requestAccounts' });
        
        // Switch to Base Sepolia
        try {
            await window.ethereum?.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x14a34' }], // 84532 in hex
            });
        } catch (switchError: any) {
            // Add the network if it doesn't exist
            if (switchError.code === 4902) {
                await window.ethereum?.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x14a34',
                        chainName: 'Base Sepolia',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://sepolia.base.org'],
                        blockExplorerUrls: ['https://sepolia.basescan.org']
                    }]
                });
            }
        }
        
        this.signer = await this.provider.getSigner();
        await this.initializeContracts();
        const address = await this.signer.getAddress();
        const network = await this.provider.getNetwork();

        return {
            address,
            network: {
                name: network.name,
                chainId: Number(network.chainId)
            }
        };
    }

    async getUSDTBalance(address: string): Promise<string> {
        await this.initializeContracts();
        const balance = await this.usdtContract.balanceOf(address);
        return ethers.formatUnits(balance, 18); // USDT uses 6 decimals
    }

    async getDOGEBalance(address: string): Promise<string> {
        await this.initializeContracts();
        const balance = await this.dogeContract.balanceOf(address);
        return ethers.formatEther(balance);
    }

    formatAmount(amount: number, decimals: number = 18): bigint {
        return ethers.parseUnits(amount.toString(), decimals);
    }

    parseAmount(amount: bigint, decimals: number = 18): string {
        return ethers.formatUnits(amount, decimals);
    }

    async calculateRepaymentAmount(address: string) {
        try {
            await this.ensureContractsInitialized();
            const [totalRepayment, principal, interestAmount] = 
                await this.memebankContract.calculateRepaymentAmount(address);
            
            return {
                totalRepayment: ethers.formatEther(totalRepayment),
                principal: ethers.formatEther(principal),
                interestAmount: ethers.formatEther(interestAmount)
            };
        } catch (error) {
            console.error('Error calculating repayment amount:', error);
            return {
                totalRepayment: '0',
                principal: '0',
                interestAmount: '0'
            };
        }
    }
} 