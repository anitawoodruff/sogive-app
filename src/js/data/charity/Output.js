

import _ from 'lodash';
import DataClass, {getType} from '../../base/data/DataClass';

/* Output type, which also does Impact: 
{
	name {String}
	number: {Number} Number of units output, e.g. the number of malaria nets
	cost: {Money} total cost, ie cost = costPerBeneficiary * number
	costPerBeneficiary {Money} Should really be called costPerOutput
	amount: {String} non-numerical descriptions of how much was output
	confidence {String}
	description: {String}
	start: {Date}
	end: {Date}
	order: {Number} for display lists
	year: {Number}
}
*/

/** impact utils */
class Output extends DataClass {
	/** @type {String} */
	name;
	/** @type {Number} Number of units output, e.g. the number of malaria nets */
	number;
	// cost: {Money} total cost, ie cost = costPerBeneficiary * number
	// costPerBeneficiary {Money}
	// amount: {String} non-numerical descriptions of how much was output
	// confidence {String}
	// description: {String}
	// start: {Date}
	// end: {Date}
	// order: {Number} for display lists
	// year: {Number}

	constructor(base) {
		super(base);
		Object.assign(this, base);
	}

}
DataClass.register(Output, "Output");
const This = Output;
export default Output;

// something is making outputs without a type. oh well -- also allow a duck type test for costPerBen
Output.isa = (obj) => {
	return getType(obj)==='Output' || obj.costPerBeneficiary || obj.number;
};

Output.number = obj => {
	This.assIsa(obj);
	return obj.number;
};

/**
 * @param obj {!Output}
 * @returns {?Money}
 */
Output.cost = obj => {
	This.assIsa(obj);
	return obj.cost;
};

/**
 * A scaled version 
 * @param donationAmount {Money}
 */
Output.scaleByDonation = (output, donationAmount) => {
	// deep copy
	let impact = _.cloneDeep(output);
	// TODO scaled by donationAmount
	// TODO change units if necc
	// TODO Java needs a mirror of this :(
	console.error("scale!", impact, donationAmount);
	return impact;
};
