package ptithcm.tttnd35backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // bật OrderTimeoutScheduler tự huỷ đơn quá hạn thanh toán
public class TttnD35BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TttnD35BackendApplication.class, args);
    }

}
