// @Flow
import React, { Component } from 'react';
import _ from 'lodash';
import { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import {XId } from 'wwutils';
import { Modal } from 'react-bootstrap';

import C from '../C';
import printer from '../base/utils/printer';
import ActionMan from '../plumbing/ActionMan';
import DataStore from '../base/plumbing/DataStore';
import NGO from '../data/charity/NGO';
import FundRaiser from '../data/charity/FundRaiser';
import Donation from '../data/charity/Donation';
import Transfer from '../base/data/Transfer';
import Money from '../base/data/Money';
import Basket from '../data/Basket';

import Misc from '../base/components/Misc';
import {nonce, getId, getType} from '../base/data/DataClass';
import PaymentWidget from '../base/components/PaymentWidget';
import Wizard, {WizardStage} from '../base/components/WizardProgressWidget';
import {notifyUser} from '../base/plumbing/Messaging';

/**
 * 
 * TODO Doc notes on the inputs to this. the charity profile sends in charity and project.
 */

// falsy value for SERVER_TYPE = production
const stripeKey = (C.SERVER_TYPE) ?
	'pk_test_RyG0ezFZmvNSP5CWjpl5JQnd' // test
	: 'pk_live_InKkluBNjhUO4XN1QAkCPEGY'; // live

/**
 * NB: We can have several DonateButtons, but only one model form
 */
const DonateButton = ({item, paidElsewhere}) => {
	assert(item && getId(item), "DonationWizard.js - DonateButton: no item "+item);
	const widgetPath = ['widget', 'DonationWizard', getId(item)];
	// no donations to draft fundraisers or charities
	if (false && (item.status === C.KStatus.DRAFT || item.status === C.KStatus.MODIFIED)) {
		return (
			<button className='btn btn-lg btn-primary disabled' title='This is a draft preview page - publish to actually donate'>Donate</button>
		);	
	}
	
	return (
		<button className='btn btn-lg btn-primary' 
			onClick={() => {
				// DataStore.setValue([...donationPath, 'fundRaiser'], getId(item));
				// poke the paidElsewhere flag
				DataStore.setValue([...widgetPath, 'paidElsewhere'], paidElsewhere, false); 
				DataStore.setValue([...widgetPath, 'open'], true);
			}}
		>
			Donate
		</button>
	);
};

/**
 * item: a FundRaiser or NGO
 * 
 * Warning: Only have ONE of these on a page! Otherwise both will open at once!
 */
const CharityPageImpactAndDonate = ({item, charity, causeName, fromEditor}) => {	

	const id = getId(item);
	assert(id, "CharityPageImpactAndDonate", item);
	assert(NGO.isa(item) || FundRaiser.isa(item) || Basket.isa(item), "DonationWizard.jsx", item);	
	if ( ! causeName) causeName = item.displayName || item.name || id;

	if ( ! charity) {
		if (NGO.isa(item)) charity = item;
		else if (FundRaiser.isa(item)) charity = FundRaiser.charity(item);
	}
	let charityId = charity? getId(charity) : item.charityId;
	const widgetPath = ['widget', 'DonationWizard', id];
	
	// There can only be one!
	// TODO move this to Misc for reuse TODO reuse this safety test with other only-one-per-page dialogs
	// ?? maybe replace the assert with a more lenient return null??
	const rpath = ['transient', 'render'].concat(widgetPath);
	const already = DataStore.getValue(rpath);	
	assert( ! already, "DonationWizard.jsx - duplicate "+widgetPath);
	DataStore.setValue(rpath, true, false);

	// what stage?
	const stagePath = ['location', 'params', 'dntnStage'];
	const stage = Number.parseInt(DataStore.getUrlValue('dntnStage'));

	// not open? just show the button
	let isOpen = DataStore.getValue([...widgetPath, 'open']);
	// THERE IS DEFINITELY A BETTER WAY OF CHECKING THIS. I JUST HAD TO ADD ISNAN TO THE LIST OF "THINGS STAGE SHOULD NOT BE" RIGHT BEFORE A DEMO.
	if (isOpen===undefined || isOpen===null) {
		isOpen = stage!==undefined && stage!==null && !isNaN(stage);
	}
	if ( ! isOpen) {
		return null;
	}

	// paid elsewhere, or (the default) paid here?
	let paidElsewhere = DataStore.getValue([...widgetPath, 'paidElsewhere']);

	// close dialog and reset the wizard stage
	const closeLightbox = () => {
		DataStore.setValue([...widgetPath, 'open'], false);
		DataStore.setValue(stagePath, null);

		//Check if donation is draft
		if(C.KStatus.isPUBLISHED(donationDraft.status)) {
			ActionMan.clearDonationDraft({donation: donationDraft});
		}
	};

	// get/make the draft donation
	let type = C.TYPES.Donation;
	let pDonation = ActionMan.getDonationDraft({item});
	// if the promise is running, wait for it before making a new draft
	if ( ! pDonation.resolved) {
		return (
			<Modal show className="donate-modal" onHide={closeLightbox}>
				<Modal.Body>
					<Misc.Loading />
				</Modal.Body>
			</Modal>
		);
	}

	let donationDraft = pDonation.value;
	Donation.assIsa(donationDraft);
	
	const path = DataStore.getPath(C.KStatus.DRAFT, type, donationDraft.id);
	assert(donationDraft === DataStore.getValue(path), DataStore.getValue(path));
	// Don't ask for gift-aid details if the charity doesn't support it
	const showGiftAidSection = charity && charity[NGO.PROPS.$uk_giftaid()];
	// We don't need to collect address etc. if we're not collecting gift-aid
	const showDetailsSection = true; // hm - the UX flow is a bit odd with this popping in. DataStore.getValue(path.concat('giftAid'));
	// You don't send messages to charities...
	const showMessageSection = FundRaiser.isa(item);

	return (
		<Modal show className="donate-modal" onHide={closeLightbox}>
			<Modal.Header closeButton >
				<Modal.Title>Donate to {causeName}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Wizard stagePath={stagePath} >
					<WizardStage title='Amount' >
						<AmountSection path={path} fromEditor={fromEditor} />
					</WizardStage>
				
					{showGiftAidSection? <WizardStage title='Gift Aid' setNavStatus>
						<GiftAidSection path={path} charity={charity} stagePath={stagePath} />
					</WizardStage> : null}
				
					{showDetailsSection? <WizardStage title='Details' setNavStatus>
						<DetailsSection path={path} stagePath={stagePath} fromEditor={fromEditor} setNavStatus />
					</WizardStage> : null}
				
					{showMessageSection? <WizardStage title='Message'>
						<MessageSection path={path} recipient={item.owner} />
					</WizardStage> : null}
				
					<WizardStage title='Payment' next={false} >
						<PaymentSection path={path} donation={donationDraft} item={item} paidElsewhere={paidElsewhere} closeLightbox={closeLightbox} />
					</WizardStage>
				
					<WizardStage title='Receipt' previous={false} >
						<ThankYouSection path={path} item={item} />
					</WizardStage>
				</Wizard>
			</Modal.Body>
			<Misc.SavePublishDiscard type={type} id={donationDraft.id} hidden />
		</Modal>
	);
}; // ./CharityPageImpactAndDonate

const AmountSection = ({path, fromEditor}) => {
	let credit = Transfer.getCredit();	
	const dontn = DataStore.getValue(path);
	console.log("donation", JSON.stringify(dontn));
	const pathAmount = path.concat('amount');
	let val = DataStore.getValue(pathAmount);
	//&& (val.raw === undefined) is a patch fix to allow the field to be blank/0.
	if ( (!val || !Money.value(val)) && (val.raw === undefined)) {
		// HACK: grab the amount from the impact widget of CharityPageImpactAndDonate?
		let cid = Donation.to(dontn);
		val = DataStore.getValue(['widget', 'CharityPageImpactAndDonate', cid, 'amount']);
		// stored donation is zero or default? Set to amount of user's credit if present
		const valValue = Money.value(val);
		if (valValue === 0 || valValue === 10) {
			val = credit&&credit.value ? credit : Money.make({value: 10});//Ternary fixes issue where credit= {value:0, ...} was causing an infinite update loop
		}
		DataStore.setValue(pathAmount, val);
	}
	return (
		<div className='section donation-amount'>			
			<Misc.PropControl prop='amount' path={path} type='Money' label='Donation' value={val} />
			{Money.value(credit)? <p><i>You have <Misc.Money amount={credit} /> in credit.</i></p> : null}
			<Misc.PropControl prop='anonAmount' label='Hide my donation amount?' path={path} type='checkbox' />
		</div>);
};

const GiftAidSection = ({path, charity, stagePath, setNavStatus}) => {
	assert(stagePath, "GiftAidSection no stagePath");
	const ownMoney = DataStore.getValue(path.concat('giftAidOwnMoney'));
	const fromSale = DataStore.getValue(path.concat('giftAidFundRaisedBySale'));
	const benefit = DataStore.getValue(path.concat('giftAidBenefitInReturn'));
	const taxpayer = DataStore.getValue(path.concat('giftAidTaxpayer'));
	const yesToGiftAid = DataStore.getValue(path.concat('giftAid'));
			
	const canGiftAid = !! (ownMoney && taxpayer && fromSale===false && benefit===false);
	const cannotGiftAid = !! (ownMoney===false || taxpayer===false || fromSale || benefit);
	
	// If we're disabling the checkbox, untick it too
	if (cannotGiftAid) {
		DataStore.setValue(path.concat('giftAid'), false, false);
	}

	// Explicitly tell user the result of their answers
	let giftAidMessage = '';
	if (canGiftAid) {
		giftAidMessage = (<p>
				Hooray: Your donation qualifies for Gift Aid!<br />
				If you pay less Income Tax and/or Capital Gains Tax in the current tax year than the amount
				of Gift Aid claimed on all your donations, it is your responsibility to pay any difference.
		</p>);
	} else if (cannotGiftAid) {
		giftAidMessage = (<p>This donation does not qualify for Gift Aid. 
				That's OK - many donations don't, and the difference is a small fraction.</p>
		);
	}

	let suff = canGiftAid || cannotGiftAid;
	if (setNavStatus) setNavStatus({sufficient: suff, complete: cannotGiftAid || (canGiftAid && yesToGiftAid)});

	return (
		<div className='section donation-amount'>
			<img src='/img/giftaid-it-logo.gif' alt='Gift Aid It' />
			<p>
				GiftAid can add considerably to your donation at no extra cost.<br />
				Please answer the questions below to see if this donation qualifies for GiftAid.
			</p>
			<Misc.PropControl prop='giftAidOwnMoney' path={path} type='yesNo'
				label='This donation is my own money. It has not come from anyone else e.g. a business, friends, or a collection.'
			/>
			<Misc.PropControl prop='giftAidFundRaisedBySale' path={path} type='yesNo'
				label='This is the proceeds from the sale of goods or provision of service e.g. a cake sale, auction or car wash.'
			/>
			<Misc.PropControl prop='giftAidBenefitInReturn' path={path} type='yesNo'
				label='I am receiving a benefit from this donation e.g. entry to an event, raffle or sweepstake.'
			/>
			<Misc.PropControl prop='giftAidTaxpayer' path={path} type='yesNo'
				label='I am a UK taxpayer.'
			/>
			{giftAidMessage}
			<Misc.PropControl prop='giftAid' path={path} type='checkbox' disabled={ ! canGiftAid}
				label='I want to Gift Aid this donation, and agree to sharing my details for this.'
			/>
		</div>
	);
};

const DetailsSection = ({path, stagePath, setNavStatus, charity, fromEditor}) => {
	const {giftAid, donorName, donorEmail, donorAddress, donorPostcode} = DataStore.getValue(path);
	const allDetails = donorName && donorEmail && donorAddress && donorPostcode;
	if (setNavStatus) {
		let sufficient = allDetails || ! giftAid;
		setNavStatus({sufficient, complete: allDetails});
	}
	// dflt={Login.getUser() && Login.getUser().name} 
	// dflt={Login.getEmail()}
	return (
		// TODO do we have the user's details stored?	
		<div className='section donation-amount'>
			{giftAid? <p>These details will be passed to the charity so they can claim Gift-Aid.</p> 
				: <p>These details are optional: you can give anonymously.</p>}
			{fromEditor? <Misc.PropControl label='Donor ID' path={path} prop='from' /> : null}
			<Misc.PropControl prop='donorName' label='Name' placeholder='Enter your name' path={path} type='text' />
			<Misc.PropControl prop='donorEmail' label='Email' placeholder='Enter your address' path={path} type='email' />
			<Misc.PropControl prop='donorAddress' label='Address' placeholder='Enter your address' path={path} type='address' />
			<Misc.PropControl prop='donorPostcode' label='Postcode' placeholder='Enter your postcode' path={path} type='postcode' />
			{ ! giftAid? <Misc.PropControl prop='consentToSharePII' 
				label={'Can '+(charity? NGO.displayName(charity) : 'the charity')+' use these details to contact you?'} 
				path={path} type='checkbox' />
				: null}
			<Misc.PropControl prop='anonymous' label='Keep this donation anonymous?' path={path} type='checkbox' />
		</div>);
};

const MessageSection = ({path, recipient}) => (
	<div className='section donation-amount'>
		<Misc.PropControl 
			prop='message' 
			label='Message' 
			placeholder={`Do you have a message for ${recipient? recipient.name : 'them'}?`} 
			path={path} type='textarea' />
	</div>
);


/**
 * Process the actual payment! Which is done by publishing the Donation.
 * 
 * PaymentWidget talks to Stripe, then passes over to this method for the actual payment.
 * TODO refactor this into PaymentWidget
 */
const onToken_doPayment = ({donation}) => {
	DataStore.setData(C.KStatus.DRAFT, donation);
	// invalidate credit if some got spent	
	let credit = Transfer.getCredit();
	if (credit && Money.value(credit) > 0) {
		DataStore.invalidateList(C.TYPES.Transfer);
	}

	// publish the donation NB: Crud.js will invalidate the list
	ActionMan.publishEdits(C.TYPES.Donation, donation.id, donation)
		.then(() => {
			const stagePath = ['location', 'params', 'dntnStage'];
			const stage = Number.parseInt(DataStore.getValue(stagePath));
			DataStore.setValue(stagePath, Number.parseInt(stage) + 1);
			// do a fresh load of the fundraiser?
			if (donation.fundRaiser) {
				//ActionMan.clearDonationDraft({donation});
				//This function appears to have been lost somewhere along the way.
				ActionMan.refreshDataItem({type:C.TYPES.FundRaiser, id:donation.fundRaiser, status:C.KStatus.PUBLISHED});
			} else {
				console.log("DonationWizard doPayment - no fundraiser to refresh", donation);
			}
		});
};


const PaymentSection = ({path, donation, item, paidElsewhere, closeLightbox}) => {
	assert(C.TYPES.isDonation(getType(donation)), ['path',path,'donation',donation]);
	assert(NGO.isa(item) || FundRaiser.isa(item) || Basket.isa(item), "DonationWizard.jsx", item);	
	if ( ! donation) {
		return null;
	}
	
	const {amount} = donation;
	if ( ! amount) {
		return null;
	}
	Money.assIsa(amount);
	// tip?
	// default: £1
	if (donation.hasTip === undefined) donation.hasTip = true;
	if (donation.tip===undefined) donation.tip = Money.make({currency:'GBP', value:1});
	let amountPlusTip = amount;
	if (donation.tip && donation.hasTip) amountPlusTip = Money.add(amount, donation.tip);

	// Not the normal payment?
	if (paidElsewhere) {
		donation.paidElsewhere = true;
		return (<div>
			<p>This form is for donations that have already been paid.</p>
			<Misc.PropControl label='Where did the payment come from?' prop='paymentMethod' path={path} type='text' />
			<Misc.PropControl label='Payment ID, if known?' prop='paymentId' path={path} type='text' />
			<button onClick={e => {
				ActionMan.publishEdits(C.TYPES.Donation, donation.id, donation)
				.then(res => {
					notifyUser('Off-site donation published - reload to see');
					closeLightbox();
				});				
			}} className='btn btn-primary'>Publish Donation</button>
		</div>);
	}

	/**
	 * Add the stripe token to the Donation object and publish the Donation
	 * @param {id:String, type:String, token:String} token 
	 */
	const onToken = (token) => {
		donation.stripe = token;
		onToken_doPayment({donation});
	};

	return (<div>
		<div className='padded-block'>
			<Misc.PropControl type='checkbox' path={path} item={donation} prop='hasTip' label={`Include a tip to cover SoGive's operating costs?`} />
			<Misc.PropControl type='Money' path={path} item={donation} prop='tip' label='Tip amount' disabled={donation.hasTip===false} />			
		</div>
		<PaymentWidget onToken={onToken} amount={amountPlusTip} recipient={item.name} />
	</div>);
};

const ThankYouSection = ({path, item}) => {
	const donation = DataStore.getValue(path);
    let amountPlusTip;
    if (donation.tip && donation.hasTip) amountPlusTip = Money.add(donation.amount, donation.tip);
	return (
		<div className='text-center'>
			<h3>Thank You!</h3>
			<big>
				<p>
					We've received your donation of <Misc.Money amount={amountPlusTip || donation.amount} /> to {item.name} <br />
				</p>
				{amountPlusTip ? <p>(including a tip of <Misc.Money amount={donation.tip} /> to cover SoGive's costs). <br /></p> : null}
				<p>
					Thanks for using SoGive!
				</p>
			</big>
		</div>
	);
};

export {DonateButton};
export default CharityPageImpactAndDonate;