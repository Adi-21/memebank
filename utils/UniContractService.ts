declare global {
    interface Window {
        ethereum?: any;
    }
}

import { ethers } from "ethers";
import type { TransactionResponse } from "ethers";
import MemebankABI from "./memebank.json";
import DogeABI from "./doge.json";
import UsdtABI from "./usdt.json";
import OracleABI from "./oracle.json";

// Unichain Contract Addresses
const MEMEBANK_ADDRESS = "0x04AadC73a574e309B1e346d326529f039826630f";
const USDT_ADDRESS = "0x70972044A7fD7dF4B431200f2615bD2f6744a3D8";
const DOGE_ADDRESS = "0xC7A897f91EaA7A883c161416AE773Db6C8A223A1";
const ORACLE_ADDRESS = "0xdDE2D5D7B99aa5937327f5D9A47539274d244190";

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

export class UniContractService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;
    private memebankContract!: ethers.Contract;
    private usdtContract!: (ethers.Contract & ERC20Functions);
    private dogeContract!: (ethers.Contract & ERC20Functions);
    private oracleContract!: ethers.Contract;

    public async initialize() {
        if (typeof window !== 'undefined' && window.ethereum) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
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
        try {
            const owner = await this.signer!.getAddress();
            
            // Check if it's the DOGE contract
            if (tokenContract.target === DOGE_ADDRESS) {
                console.log('DOGE Contract verification:');
                console.log('Contract address:', tokenContract.target);
                console.log('Spender (Memebank):', spender);
                
                // Check DOGE balance
                const balance = await tokenContract.balanceOf(owner);
                console.log('DOGE balance:', ethers.formatEther(balance));
                
                if (balance < amount) {
                    throw new Error(`Insufficient DOGE balance. Required: ${ethers.formatEther(amount)}, Available: ${ethers.formatEther(balance)}`);
                }
            }

            // Check current allowance
            const allowance = await tokenContract.allowance(owner, spender);
            console.log('Current allowance:', ethers.formatEther(allowance));
            console.log('Required amount:', ethers.formatEther(amount));

            // If allowance is insufficient, approve
            if (allowance < amount) {
                console.log('Initiating approval...');
                // First set allowance to 0 (recommended for some tokens)
                const resetTx = await tokenContract.approve(spender, BigInt(0));
                await resetTx.wait();
                console.log('Reset allowance to 0');

                // Then set the desired allowance
                const approveTx = await tokenContract.approve(spender, amount);
                const receipt = await approveTx.wait();
                if (!receipt) throw new Error('Failed to get transaction receipt');
                console.log('Approval transaction confirmed:', receipt.hash);
                
                // Verify the new allowance
                const newAllowance = await tokenContract.allowance(owner, spender);
                console.log('New allowance:', ethers.formatEther(newAllowance));
                
                if (newAllowance < amount) {
                    throw new Error('Approval failed - allowance not set correctly');
                }
            }
        } catch (error) {
            console.error('Approval process failed:', error);
            throw error;
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
                params: [{ chainId: '0x515' }], 
            });
        } catch (switchError: any) {
            // Add the network if it doesn't exist
            if (switchError.code === 4902) {
                await window.ethereum?.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x515',
                        chainName: 'Unichain Sepolia',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://sepolia.unichain.org'],
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