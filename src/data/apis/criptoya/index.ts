export interface ICriptoyaFees {
	[exchange: string]: {
		[crypto: string]: {
			[network: string]: number;
		};
	};
}
