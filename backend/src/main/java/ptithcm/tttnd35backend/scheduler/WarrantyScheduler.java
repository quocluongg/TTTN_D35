package ptithcm.tttnd35backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.repository.IWarrantyCardRepository;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class WarrantyScheduler {

    private final IWarrantyCardRepository warrantyCardRepository;

    @Scheduled(cron = "${app.scheduler.warranty-expiration-cron:0 0 1 * * *}")
    @Transactional
    public void processExpiredWarrantyCards() {
        log.info("Running WarrantyScheduler to expire past-due warranty cards...");
        int count = warrantyCardRepository.updateExpiredCards(LocalDate.now());
        log.info("WarrantyScheduler finished. Expired {} warranty card(s).", count);
    }
}
