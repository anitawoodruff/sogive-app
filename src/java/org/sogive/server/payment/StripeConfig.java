package org.sogive.server.payment;

import com.winterwell.utils.io.Option;

public class StripeConfig {

	public StripeConfig() { }
	
	@Option
	String secretKey;
	
	@Option
	String testSecretKey;
	
	@Option
	String testPubKey;
		
	@Option
	String pubKey;
	
	@Option(description="Default to true (test) for safety, so you have to explicitly request 'its real money'")
	boolean testStripe = true;
}
