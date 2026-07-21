package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.util.enums.OtpPurpose;

public interface IOtpService {
    public void generateAndSend(Profile profile, OtpPurpose purpose);
    public void verify(Profile profile, String code, OtpPurpose purpose);
}
