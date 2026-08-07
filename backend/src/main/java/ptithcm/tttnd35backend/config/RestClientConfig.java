package ptithcm.tttnd35backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/** RestClient dùng chung cho các lời gọi HTTP ra ngoài (Google tokeninfo, Python RAG service...). */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }
}
