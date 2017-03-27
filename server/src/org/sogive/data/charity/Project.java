/**
 * 
 */
package org.sogive.data.charity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.function.BiPredicate;

import com.winterwell.gson.JsonIOException;
import com.winterwell.utils.MathUtils;
import com.winterwell.utils.Printer;
import com.winterwell.utils.Utils;
import com.winterwell.utils.containers.Containers;
import com.winterwell.utils.log.Log;

/**
 * @author daniel
 *
 */
public class Project extends Thing<Project> {

	
	@Override
	public String toString() {	
		return "Project["+getName()+" "+get("year")+"]";
	}
	// Does schema org have a task defined by inputs / outputs??
	
	private static final long serialVersionUID = 1L;

	public Project(String name) {
		put("name", name);
	}
	Project() {	
	}

	public void merge(Project project) {
		// union inputs & outputs
		List<MonetaryAmount> inputs = getInputs();
		List<MonetaryAmount> newInputs = project.getInputs();
		for (MonetaryAmount n : newInputs) {
			if ( ! inputs.contains(n)) { // TODO match on name & year, to allow amounts to be corrected
				inputs.add(n);
			}
		}		
		List<Output> outputs = getOutputs();
		List<Output> newOutputs = project.getOutputs();
		for (Output n : newOutputs) {
			if ( ! outputs.contains(n)) { // TODO match on name & year, to allow amounts to be corrected
				outputs.add(n);
			}
		}
		// overwrite the rest
		putAll(project);
		project.put("inputs", inputs);
		project.put("outputs", outputs);
	}

	public List<MonetaryAmount> getInputs() {
		List outputs = getThings((List) get("inputs"), MonetaryAmount.class);
		if (outputs==null) {
			outputs = new ArrayList();
			put("inputs", outputs);
		}
		return outputs;
	}
	
	public List<Output> getOutputs() {
		List outputs = getThings((List) get("outputs"), Output.class);
		if (outputs==null) {
			outputs = new ArrayList();
			put("outputs", outputs);
		}
		return outputs;
	}

	public void addInput(String costName, MonetaryAmount ac) {
		ac.put("name", costName);
		addOrMerge("inputs", ac);
	}


	public void addOutput(Output ac) {
		List<Output> os = addOrMerge("outputs", ac, Output::match);
	}
	
	public List<Output> getImpact(List<Output> outputs, MonetaryAmount amount) {
//		Optional<Long> year = outputs.stream().map(o -> o.getYear()).max(Long::compare);
		List<MonetaryAmount> inputs = getInputs();
		// only the latest year - but a Project is single year
		// TODO what if the years don't match?
		MonetaryAmount totalCosts = Containers.first(inputs, ma -> "annualCosts".equals(ma.getName()));
		MonetaryAmount fundraisingCosts = Containers.first(inputs, ma -> "fundraisingCosts".equals(ma.getName()));
		MonetaryAmount tradingCosts = Containers.first(inputs, ma -> "tradingCosts".equals(ma.getName()));
		MonetaryAmount incomeFromBeneficiaries = Containers.first(inputs, ma -> "incomeFromBeneficiaries".equals(ma.getName()));			
		
		MonetaryAmount cost = totalCosts;
		if (cost==null) {
			// can't calc anything
			return null;
		}
		if (cost.getValue()==0) {
			Log.i("data", "0 cost for "+this);
			return null;
		}
//		assert cost.getValue() > 0 : cost+" "+this;
		// What should the formula be?
		// ...remove income e.g. the malaria net cost $10 but the person getting it paid $1, so $9 isthe cost to the charity
		if (incomeFromBeneficiaries != null) {
			cost = cost.minus(incomeFromBeneficiaries);
		}
//		assert cost.getValue() > 0 : cost+" "+this;
		// Remove fundraising costs. 
		// This feels dubious to me. I think fundraising is part of how well a charity operates,
		// and it is likely that some of your donation will be re-invested in fundraising. 
		// The business equivalent would be to exclude marketing costs when looking at likely dividends
		// -- which would be odd. ^Dan
		// TODO make this a user-configurable setting.
		// TODO test what other people think.
		if (fundraisingCosts != null) {
			cost = cost.minus(fundraisingCosts);
		}
//		assert cost.getValue() > 0 : cost+" "+this;
		if (tradingCosts != null) {
			cost = cost.minus(tradingCosts);
		}
//		assert cost.getValue() > 0 : cost+" "+this;
		
		// What would £1 achieve?
		List impacts = new ArrayList();
		double unitFraction = 1.0 /  cost.getValue();
		if (unitFraction <= 0) {
			Log.w("data", "Negative costs?! "+cost+" "+this);
			return null;
		}
		for(Output output : outputs) {
			// override by adhoc formula
			Object cpb = get("costPerBeneficiary");
			Output unitImpact;
			if (cpb!=null) {
				double costPerBen = MathUtils.getNumber(cpb);
				assert costPerBen > 0 : cpb;
				unitImpact = output.scale(1); // i.e. copy
				unitImpact.put("number", 1.0 / costPerBen);
			} else {
				// normal case
				unitImpact = output.scale(unitFraction);
			}			
			unitImpact.put("price", MonetaryAmount.pound(1));
			impacts.add(unitImpact);
		}
		// done
		return impacts;
	}
	
	public boolean isReady() {
		return Utils.truthy(get("ready"));
	}
	public boolean isRep() {
		Object ir = get("isRep");
		return Utils.truthy(ir);
	}
}
