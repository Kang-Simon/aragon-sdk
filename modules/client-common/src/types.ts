import {
  DeployedAddresses,
  GraphQLContextParams,
  GraphQLContextState,
  IpfsContextParams,
  IpfsContextState,
  Web3ContextParams,
  Web3ContextState,
} from "./internal";

export type ContextParams =
  & Web3ContextParams
  & IpfsContextParams
  & GraphQLContextParams;

export type ContextState =
  & Web3ContextState
  & IpfsContextState
  & GraphQLContextState;

export type OverriddenState =
  & {
    [key in DeployedAddresses]: boolean;
  }
  & {
    gasFeeEstimationFactor: boolean;
    ipfsNodes: boolean;
    graphqlNodes: boolean;
  };

export enum SupportedNetwork {
  MAINNET = "homestead",
  GOERLI = "goerli",
  POLYGON = "matic",
  MUMBAI = "maticmum",
  BASE = "base",
  BASE_GOERLI = "baseGoerli",
  LOCAL = "local",
}

export const SupportedNetworksArray = Object.values(SupportedNetwork);

/**
 * Contains the payload passed to the global DAO factory so that
 * plugins can be initialized
 */
export interface PluginInstallItem {
  id: string; // ENS domain or address of the plugin's Repo
  data: Uint8Array;
}

export type GasFeeEstimation = {
  average: bigint;
  max: bigint;
};

/**
 * Contains the payload passed to governance contracts, serializing
 * the actions to do upon approval
 */
export type DaoAction = {
  to: string;
  value: bigint;
  data: Uint8Array;
};

export type MetadataAbiInput = {
  name: string;
  type: string;
  internalType: string;
  description: string;
  components?: MetadataAbiInput[];
};

export type PrepareInstallationParams = {
  daoAddressOrEns: string;
  pluginRepo: string;
  version?: {
    build: number;
    release: number;
  };
  installationParams?: any[];
  installationAbi?: MetadataAbiInput[];
};

export enum PrepareInstallationStep {
  PREPARING = "preparing",
  DONE = "done",
}

export type PrepareInstallationStepValue =
  | { key: PrepareInstallationStep.PREPARING; txHash: string }
  | {
    key: PrepareInstallationStep.DONE;
  } & ApplyInstallationParams;

export type ApplyInstallationParamsBase = {
  permissions: MultiTargetPermission[];
  versionTag: VersionTag;
  pluginRepo: string;
  pluginAddress: string;
};

export type ApplyInstallationParams = ApplyInstallationParamsBase & {
  helpers: string[];
};
export type DecodedApplyInstallationParams = ApplyInstallationParamsBase & {
  helpersHash: string;
};

export type VersionTag = {
  build: number;
  release: number;
};

export enum PermissionOperationType {
  GRANT = 0,
  REVOKE = 1,
  GRANT_WITH_CONDITION = 2,
}

export type MultiTargetPermission = {
  operation: PermissionOperationType;
  where: string;
  who: string;
  condition?: string;
  permissionId: string;
};

export type Pagination = {
  skip?: number;
  limit?: number;
  direction?: SortDirection;
};

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

export interface InterfaceParams {
  id: string;
  functionName: string;
  hash: string;
}

export enum TokenType {
  NATIVE = "native",
  ERC20 = "erc20",
  ERC721 = "erc721",
  ERC1155 = "erc1155",
}

/**
 * Contains the human-readable information about a proposal
 */
export type ProposalMetadata = {
  title: string;
  summary: string;
  description: string;
  resources: Array<{ url: string; name: string }>;
  media?: {
    header?: string;
    logo?: string;
  };
};

/**
 * Contains the human-readable information about a proposal
 */
export type ProposalMetadataSummary = {
  title: string;
  summary: string;
};

export enum ProposalStatus {
  ACTIVE = "Active",
  PENDING = "Pending",
  SUCCEEDED = "Succeeded",
  EXECUTED = "Executed",
  DEFEATED = "Defeated",
}

// Long version
export type ProposalBase = {
  id: string;
  dao: {
    address: string;
    name: string;
  };
  creatorAddress: string;
  metadata: ProposalMetadata;
  startDate: Date;
  endDate: Date;
  creationDate: Date;
  actions: DaoAction[];
  status: ProposalStatus;
  creationBlockNumber: number;
  executionDate: Date | null;
  executionBlockNumber: number | null;
  executionTxHash: string | null;
};

// Short version
export type ProposalListItemBase = {
  id: string;
  dao: {
    address: string;
    name: string;
  };
  creatorAddress: string;
  metadata: ProposalMetadataSummary;
  startDate: Date;
  endDate: Date;
  status: ProposalStatus;
};
