import { ProposalStatus } from "@aragon/sdk-client-common";
import { computeProposalStatus } from "../../../src/addresslistVoting/internal/utils";
import { SubgraphAddresslistVotingProposal } from "../../../src/addresslistVoting/internal/types";

describe("addresslistVoting-client utils", () => {
  describe("computeProposalStatus", () => {
    it("should return PENDING", () => {
      const endDate = Date.now() / 1000;
      const startDate = (Date.now() / 1000) + 500;

      expect(computeProposalStatus({
        endDate: endDate.toString(),
        startDate: startDate.toString(),
        potentiallyExecutable: false,
        executed: false,
        earlyExecutable: false,
      } as SubgraphAddresslistVotingProposal)).toBe(ProposalStatus.PENDING);
    });
    it("should return EXECUTED", () => {
      const endDate = Date.now() / 1000;
      const startDate = (Date.now() / 1000) - 500;

      expect(computeProposalStatus({
        endDate: endDate.toString(),
        startDate: startDate.toString(),
        potentiallyExecutable: false,
        executed: true,
        earlyExecutable: false,
      } as SubgraphAddresslistVotingProposal)).toBe(ProposalStatus.EXECUTED);
    });
    it("should return ACTIVE", () => {
      const endDate = (Date.now() / 1000) + 500;
      const startDate = (Date.now() / 1000) - 500;

      expect(computeProposalStatus({
        endDate: endDate.toString(),
        startDate: startDate.toString(),
        potentiallyExecutable: false,
        executed: false,
        earlyExecutable: false,
      } as SubgraphAddresslistVotingProposal)).toBe(ProposalStatus.ACTIVE);
    });
    it("should return SUCCEDED if executable = true", () => {
      const endDate = Date.now() / 1000;
      const startDate = (Date.now() / 1000) - 500;

      expect(computeProposalStatus({
        endDate: endDate.toString(),
        startDate: startDate.toString(),
        potentiallyExecutable: true,
        executed: false,
        earlyExecutable: false,
      } as SubgraphAddresslistVotingProposal)).toBe(ProposalStatus.SUCCEEDED);
    });
    it("should return SUCCEDED if earlyExecutable = true", () => {
      const endDate = (Date.now() / 1000) + 500;
      const startDate = (Date.now() / 1000) - 500;

      expect(computeProposalStatus({
        endDate: endDate.toString(),
        startDate: startDate.toString(),
        potentiallyExecutable: false,
        executed: false,
        earlyExecutable: true,
      } as SubgraphAddresslistVotingProposal)).toBe(ProposalStatus.SUCCEEDED);
    });
    it("should return DEFEATED", () => {
      const endDate = (Date.now() / 1000) - 200;
      const startDate = (Date.now() / 1000) - 500;

      expect(computeProposalStatus({
        endDate: endDate.toString(),
        startDate: startDate.toString(),
        potentiallyExecutable: false,
        executed: false,
        earlyExecutable: false,
      } as SubgraphAddresslistVotingProposal)).toBe(ProposalStatus.DEFEATED);
    });
  });
});
