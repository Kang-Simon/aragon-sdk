import {
  ApplyUninstallationParams,
  AssetBalance,
  DaoDetails,
  DaoListItem,
  DaoMetadata,
  DepositErc1155Params,
  DepositErc20Params,
  DepositErc721Params,
  DepositEthParams,
  GrantPermissionDecodedParams,
  GrantPermissionParams,
  GrantPermissionWithConditionDecodedParams,
  GrantPermissionWithConditionParams,
  InstalledPluginListItem,
  PluginRepo,
  PluginRepoBuildMetadata,
  PluginRepoListItem,
  PluginRepoRelease,
  PluginRepoReleaseMetadata,
  RevokePermissionDecodedParams,
  RevokePermissionParams,
  Transfer,
  TransferType,
  WithdrawParams,
} from "../types";
import {
  ContractPermissionParams,
  ContractPermissionWithConditionParams,
  SubgraphBalance,
  SubgraphDao,
  SubgraphDaoListItem,
  SubgraphErc1155Balance,
  SubgraphErc1155TransferListItem,
  SubgraphErc20Balance,
  SubgraphErc20TransferListItem,
  SubgraphErc721Balance,
  SubgraphErc721TransferListItem,
  SubgraphNativeBalance,
  SubgraphNativeTransferListItem,
  SubgraphPluginListItem,
  SubgraphPluginRepo,
  SubgraphPluginRepoListItem,
  SubgraphPluginRepoReleaseListItem,
  SubgraphTransferListItem,
  SubgraphTransferType,
} from "./types";
import { defaultAbiCoder, Result } from "@ethersproject/abi";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";
import { AddressZero } from "@ethersproject/constants";
import { DAO__factory, PluginSetupProcessor } from "@aragon/osx-ethers";
import { PermissionIds } from "../constants";
import {
  ApplyInstallationParams,
  DecodedApplyInstallationParams,
  TokenType,
} from "@aragon/sdk-client-common";
import {
  InvalidParameter,
  NotImplementedError,
  SizeMismatchError,
} from "@aragon/sdk-common";
import { Signer } from "@ethersproject/abstract-signer";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";
import { abi as ERC721_ABI } from "@openzeppelin/contracts/build/contracts/ERC721.json";
import { abi as ERC1155_ABI } from "@openzeppelin/contracts/build/contracts/ERC1155.json";

export function unwrapDepositParams(
  params: DepositEthParams | DepositErc20Params,
): [string, bigint, string, string] {
  return [
    params.daoAddressOrEns,
    params.amount,
    (params as any)?.tokenAddress ?? AddressZero,
    "",
  ];
}

export function toDaoDetails(
  dao: SubgraphDao,
  metadata: DaoMetadata,
): DaoDetails {
  return {
    address: dao.id,
    ensDomain: dao.subdomain + ".dao.eth",
    metadata: {
      name: metadata.name,
      description: metadata.description,
      avatar: metadata.avatar || undefined,
      links: metadata.links,
    },
    creationDate: new Date(parseInt(dao.createdAt) * 1000),
    // TODO update when new subgraph schema is deployed
    // filter out plugins that are not applied
    plugins: dao.plugins.filter(
      (plugin) =>
        plugin.appliedPreparation && plugin.appliedVersion &&
        plugin.appliedPluginRepo,
    )
      .map(
        (
          plugin: SubgraphPluginListItem,
        ): InstalledPluginListItem => (
          {
            // we checked with the filter above that these are not null
            id: `${plugin.appliedPluginRepo!.subdomain}.plugin.dao.eth`,
            release: plugin.appliedVersion!.release.release,
            build: plugin.appliedVersion!.build,
            instanceAddress: plugin.appliedPreparation!.pluginAddress,
          }
        ),
      ),
  };
}

export function toDaoListItem(
  dao: SubgraphDaoListItem,
  metadata: DaoMetadata,
): DaoListItem {
  return {
    address: dao.id,
    ensDomain: dao.subdomain + ".dao.eth",
    metadata: {
      name: metadata.name,
      description: metadata.description,
      avatar: metadata.avatar || undefined,
    },
    plugins: dao.plugins.filter(
      (plugin) =>
        plugin.appliedPreparation && plugin.appliedVersion &&
        plugin.appliedPluginRepo,
    )
      .map(
        (
          plugin: SubgraphPluginListItem,
        ): InstalledPluginListItem => (
          {
            // we checked with the filter above that these are not null
            id: `${plugin.appliedPluginRepo!.subdomain}.plugin.dao.eth`,
            release: plugin.appliedVersion!.release.release,
            build: plugin.appliedVersion!.build,
            instanceAddress: plugin.appliedPreparation!.pluginAddress,
          }
        ),
      ),
  };
}

function toNativeBalance(balance: SubgraphNativeBalance): AssetBalance {
  return {
    id: balance.id,
    type: TokenType.NATIVE,
    balance: BigInt(balance.balance),
    updateDate: new Date(parseInt(balance.lastUpdated) * 1000),
  };
}

function toErc20Balance(balance: SubgraphErc20Balance): AssetBalance {
  return {
    id: balance.id,
    type: TokenType.ERC20,
    address: balance.token.id,
    name: balance.token.name,
    symbol: balance.token.symbol,
    decimals: balance.token.decimals,
    balance: BigInt(balance.balance),
    updateDate: new Date(parseInt(balance.lastUpdated) * 1000),
  };
}

function toErc721Balance(balance: SubgraphErc721Balance): AssetBalance {
  return {
    id: balance.id,
    type: TokenType.ERC721,
    address: balance.token.id,
    name: balance.token.name,
    symbol: balance.token.symbol,
    updateDate: new Date(parseInt(balance.lastUpdated) * 1000),
    tokenIds: balance.tokenIds.map((id) => BigInt(id)),
  };
}
function toErc1155Balance(balance: SubgraphErc1155Balance): AssetBalance {
  return {
    id: balance.id,
    type: TokenType.ERC1155,
    address: balance.token.id,
    metadataUri: balance.metadataUri,
    updateDate: new Date(parseInt(balance.lastUpdated) * 1000),
    balances: balance.balances.map((balance) => ({
      tokenId: BigInt(balance.tokenId),
      amount: BigInt(balance.amount),
      id: balance.id,
    })),
  };
}

export function toAssetBalance(balance: SubgraphBalance): AssetBalance {
  switch (balance.__typename) {
    case "NativeBalance":
      return toNativeBalance(balance);
    case "ERC20Balance":
      return toErc20Balance(balance);
    case "ERC721Balance":
      return toErc721Balance(balance);
    case "ERC1155Balance":
      return toErc1155Balance(balance);
    default:
      throw new InvalidParameter("Token type not supported");
  }
}

function toErc20Transfer(
  transfer: SubgraphErc20TransferListItem,
): Transfer {
  const creationDate = new Date(parseInt(transfer.createdAt) * 1000);
  if (transfer.type === SubgraphTransferType.DEPOSIT) {
    return {
      type: TransferType.DEPOSIT,
      tokenType: TokenType.ERC20,
      token: {
        address: transfer.token.id,
        name: transfer.token.name,
        symbol: transfer.token.symbol,
        decimals: transfer.token.decimals,
      },
      amount: BigInt(transfer.amount),
      creationDate,
      transactionId: transfer.txHash,
      from: transfer.from,
      to: transfer.to,
    };
  }
  return {
    type: TransferType.WITHDRAW,
    tokenType: TokenType.ERC20,
    token: {
      address: transfer.token.id,
      name: transfer.token.name,
      symbol: transfer.token.symbol,
      decimals: transfer.token.decimals,
    },
    amount: BigInt(transfer.amount),
    creationDate,
    transactionId: transfer.txHash,
    to: transfer.to,
    from: transfer.from,
    proposalId: transfer.proposal?.id || "",
  };
}

function toErc721Transfer(
  transfer: SubgraphErc721TransferListItem,
): Transfer {
  const creationDate = new Date(parseInt(transfer.createdAt) * 1000);
  if (transfer.type === SubgraphTransferType.DEPOSIT) {
    return {
      type: TransferType.DEPOSIT,
      tokenType: TokenType.ERC721,
      token: {
        address: transfer.token.id,
        name: transfer.token.name,
        symbol: transfer.token.symbol,
      },
      creationDate,
      transactionId: transfer.txHash,
      from: transfer.from,
      to: transfer.to,
    };
  }
  return {
    type: TransferType.WITHDRAW,
    tokenType: TokenType.ERC721,
    token: {
      address: transfer.token.id,
      name: transfer.token.name,
      symbol: transfer.token.symbol,
    },
    creationDate,
    transactionId: transfer.txHash,
    to: transfer.to,
    from: transfer.from,
    proposalId: transfer.proposal?.id || "",
  };
}

function toErc1155Transfer(
  transfer: SubgraphErc1155TransferListItem,
): Transfer {
  const creationDate = new Date(parseInt(transfer.createdAt) * 1000);
  if (transfer.type === SubgraphTransferType.DEPOSIT) {
    return {
      type: TransferType.DEPOSIT,
      tokenType: TokenType.ERC1155,
      amount: BigInt(transfer.amount),
      tokenId: BigInt(transfer.tokenId),
      token: {
        address: transfer.token.id,
      },
      creationDate,
      transactionId: transfer.txHash,
      from: transfer.from,
      to: transfer.to,
    };
  }
  return {
    type: TransferType.WITHDRAW,
    tokenType: TokenType.ERC1155,
    amount: BigInt(transfer.amount),
    tokenId: BigInt(transfer.tokenId),
    token: {
      address: transfer.token.id,
    },
    creationDate,
    transactionId: transfer.txHash,
    proposalId: transfer.proposal?.id || "",
    to: transfer.to,
    from: transfer.from,
  };
}

function toNativeTransfer(
  transfer: SubgraphNativeTransferListItem,
): Transfer {
  const creationDate = new Date(parseInt(transfer.createdAt) * 1000);
  if (transfer.type === SubgraphTransferType.DEPOSIT) {
    return {
      type: TransferType.DEPOSIT,
      tokenType: TokenType.NATIVE,
      amount: BigInt(transfer.amount),
      creationDate,
      transactionId: transfer.txHash,
      from: transfer.from,
      to: transfer.to,
    };
  }
  return {
    type: TransferType.WITHDRAW,
    tokenType: TokenType.NATIVE,
    amount: BigInt(transfer.amount),
    creationDate,
    transactionId: transfer.txHash,
    proposalId: transfer.proposal?.id || "",
    to: transfer.to,
    from: transfer.from,
  };
}

export function toTokenTransfer(transfer: SubgraphTransferListItem): Transfer {
  switch (transfer.__typename) {
    case "ERC20Transfer":
      return toErc20Transfer(transfer);
    case "ERC721Transfer":
      return toErc721Transfer(transfer);
    case "NativeTransfer":
      return toNativeTransfer(transfer);
    case "ERC1155Transfer":
      return toErc1155Transfer(transfer);
    default:
      throw new InvalidParameter("Token type not supported");
  }
}

export function toPluginRepoRelease(
  release: SubgraphPluginRepoReleaseListItem,
  metadata: PluginRepoReleaseMetadata,
): PluginRepoRelease {
  return {
    release: release.release,
    currentBuild: Math.max(...release.builds.map((build) => build.build)),
    metadata,
  };
}

export function toPluginRepoListItem(
  pluginRepo: SubgraphPluginRepoListItem,
  releases: PluginRepoRelease[],
): PluginRepoListItem {
  return {
    address: pluginRepo.id,
    subdomain: pluginRepo.subdomain,
    releases,
  };
}
export function toPluginRepo(
  pluginRepo: SubgraphPluginRepo,
  releaseMetadata: PluginRepoReleaseMetadata,
  buildMetadata: PluginRepoBuildMetadata,
): PluginRepo {
  return {
    address: pluginRepo.id,
    subdomain: pluginRepo.subdomain,
    current: {
      build: {
        metadata: buildMetadata,
        // the subgraph returns only one build ordered by build number
        // in descending order, this means it's the latest build
        number: pluginRepo.releases?.[0]?.builds?.[0]?.build,
      },
      release: {
        metadata: releaseMetadata,
        // the subgraph returns only one realease ordered by realease number
        // in descending order, this means it's the latest realease
        number: pluginRepo.releases?.[0]?.release,
      },
    },
  };
}

export function applyInstallatonParamsToContract(
  params: ApplyInstallationParams,
): PluginSetupProcessor.ApplyInstallationParamsStruct {
  return {
    plugin: params.pluginAddress,
    pluginSetupRef: {
      pluginSetupRepo: params.pluginRepo,
      versionTag: params.versionTag,
    },
    helpersHash: keccak256(
      defaultAbiCoder.encode(["address[]"], [params.helpers]),
    ),
    permissions: params.permissions.map((permission) => {
      return { ...permission, condition: permission.condition || AddressZero };
    }),
  };
}
export function applyUninstallationParamsToContract(
  params: ApplyUninstallationParams,
): PluginSetupProcessor.ApplyUninstallationParamsStruct {
  return {
    plugin: params.pluginAddress,
    pluginSetupRef: {
      pluginSetupRepo: params.pluginRepo,
      versionTag: params.versionTag,
    },
    permissions: params.permissions.map((permission) => {
      return { ...permission, condition: permission.condition || AddressZero };
    }),
  };
}
export function applyInstallatonParamsFromContract(
  result: Result,
): DecodedApplyInstallationParams {
  const params = result[1];
  return {
    helpersHash: params.helpersHash,
    permissions: params.permissions,
    versionTag: params.pluginSetupRef.versionTag,
    pluginAddress: params.plugin,
    pluginRepo: params.pluginSetupRef.pluginSetupRepo,
  };
}

export function permissionParamsToContract(
  params: GrantPermissionParams | RevokePermissionParams,
): ContractPermissionParams {
  return [params.where, params.who, keccak256(toUtf8Bytes(params.permission))];
}
export function permissionWithConditionParamsToContract(
  params: GrantPermissionWithConditionParams,
): ContractPermissionWithConditionParams {
  return [
    ...permissionParamsToContract({
      who: params.who,
      where: params.where,
      permission: params.permission,
    }),
    params.condition,
  ];
}

export function permissionParamsFromContract(
  result: Result,
): GrantPermissionDecodedParams | RevokePermissionDecodedParams {
  return {
    where: result[0],
    who: result[1],
    permissionId: result[2],
    permission: Object.keys(PermissionIds)
      .find((k) => PermissionIds[k] === result[2])
      ?.replace(/_ID$/, "") || "",
  };
}
export function permissionParamsWitConditionFromContract(
  result: Result,
): GrantPermissionWithConditionDecodedParams {
  return {
    ...permissionParamsFromContract(result),
    condition: result[3],
  };
}

export function withdrawParamsFromContract(
  to: string,
  _value: bigint,
  result: Result,
  tokenStandard: TokenType,
  isBatch: boolean,
): WithdrawParams {
  switch (tokenStandard) {
    case TokenType.ERC20:
      return {
        type: TokenType.ERC20,
        tokenAddress: to,
        recipientAddressOrEns: result[0],
        amount: BigInt(result[1]),
      };
    case TokenType.ERC721:
      return {
        type: TokenType.ERC721,
        tokenAddress: to,
        recipientAddressOrEns: result[1],
        tokenId: BigInt(result[2]),
        daoAddressOrEns: result[0],
      };
    case TokenType.ERC1155:
      let tokenIds: bigint[], amounts: bigint[];
      if (isBatch) {
        tokenIds = result[2].map((id: string) => BigInt(id));
        amounts = result[3].map((amount: string) => BigInt(amount));
      } else {
        tokenIds = [BigInt(result[2])];
        amounts = [BigInt(result[3])];
      }
      return {
        type: TokenType.ERC1155,
        tokenAddress: to,
        recipientAddressOrEns: result[1],
        tokenIds,
        amounts,
        daoAddressOrEns: result[0],
      };
  }
  throw new NotImplementedError("Token standard not supported");
}

export async function estimateErc20Deposit(
  signer: Signer,
  params: DepositErc20Params | DepositEthParams,
): Promise<BigNumber> {
  let tokenAddress;
  if (params.type === TokenType.NATIVE) {
    tokenAddress = AddressZero;
  } else {
    tokenAddress = params.tokenAddress;
  }
  const daoInstance = DAO__factory.connect(params.daoAddressOrEns, signer);
  return await daoInstance.estimateGas.deposit(
    tokenAddress,
    params.amount,
    "",
  );
}

export async function estimateErc721Deposit(
  signer: Signer,
  params: DepositErc721Params,
): Promise<BigNumber> {
  const erc721Contract = new Contract(
    params.tokenAddress,
    ERC721_ABI,
    signer,
  );
  return erc721Contract.estimateGas
    ["safeTransferFrom(address,address,uint256)"](
      await signer.getAddress(),
      params.daoAddressOrEns,
      params.tokenId,
    );
}

export async function estimateErc1155Deposit(
  signer: Signer,
  params: DepositErc1155Params,
): Promise<BigNumber> {
  // if length is 0, throw
  if (!params.tokenIds.length || !params.amounts.length) {
    throw new InvalidParameter("tokenIds or amounts cannot be empty");
  }
  // if tokenIds and amounts length are different, throw
  if (
    params.tokenIds.length !== params.amounts.length
  ) {
    throw new SizeMismatchError();
  }
  const erc1155Contract = new Contract(
    params.tokenAddress,
    ERC1155_ABI,
    signer,
  );
  let estimation: BigNumber;
  if (params.tokenIds.length === 1) {
    estimation = await erc1155Contract.estimateGas
      ["safeTransferFrom(address,address,uint256,uint256,bytes)"](
        await signer.getAddress(),
        params.daoAddressOrEns,
        params.tokenIds[0],
        params.amounts[0],
        new Uint8Array(0),
      );
  } else {
    estimation = await erc1155Contract.estimateGas
      ["safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"](
        await signer.getAddress(),
        params.daoAddressOrEns,
        params.tokenIds,
        params.amounts,
        new Uint8Array(0),
      );
  }
  return estimation;
}
