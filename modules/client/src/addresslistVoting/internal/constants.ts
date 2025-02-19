import {
  AddresslistVoting__factory,
  MajorityVotingBase__factory,
} from "@aragon/osx-ethers";
import { MetadataAbiInput } from "@aragon/sdk-client-common";

export const AVAILABLE_FUNCTION_SIGNATURES: string[] = [
  MajorityVotingBase__factory.createInterface().getFunction(
    "updateVotingSettings",
  )
    .format("minimal"),
  AddresslistVoting__factory.createInterface().getFunction("addAddresses")
    .format("minimal"),
  AddresslistVoting__factory.createInterface().getFunction(
    "removeAddresses",
  ).format("minimal"),
];

export const INSTALLATION_ABI: MetadataAbiInput[] = [
  {
    components: [
      {
        internalType: "enum MajorityVotingBase.VotingMode",
        name: "votingMode",
        type: "uint8",
        description:
          "A parameter to select the vote mode. In standard mode (0), early execution and vote replacement are disabled. In early execution mode (1), a proposal can be executed early before the end date if the vote outcome cannot mathematically change by more voters voting. In vote replacement mode (2), voters can change their vote multiple times and only the latest vote option is tallied.",
      },
      {
        internalType: "uint32",
        name: "supportThreshold",
        type: "uint32",
        description:
          "The support threshold value. Its value has to be in the interval [0, 10^6] defined by `RATIO_BASE = 10**6`.",
      },
      {
        internalType: "uint32",
        name: "minParticipation",
        type: "uint32",
        description:
          "The minimum participation value. Its value has to be in the interval [0, 10^6] defined by `RATIO_BASE = 10**6`.",
      },
      {
        internalType: "uint64",
        name: "minDuration",
        type: "uint64",
        description: "The minimum duration of the proposal vote in seconds.",
      },
      {
        internalType: "uint256",
        name: "minProposerVotingPower",
        type: "uint256",
        description: "The minimum voting power required to create a proposal.",
      },
    ],
    internalType: "struct MajorityVotingBase.VotingSettings",
    name: "votingSettings",
    type: "tuple",
    description:
      "The voting settings that will be enforced when proposals are created.",
  },
  {
    internalType: "address[]",
    name: "members",
    type: "address[]",
    description: "The addresses of the initial members to be added.",
  },
];
