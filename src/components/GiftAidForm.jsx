// @Flow

import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import SJTest, {assert} from 'sjtest';
import ServerIO from '../plumbing/ServerIO';
import printer from '../utils/printer.js';
import C from '../C.js';
import NGO from '../data/charity/NGO';
import Misc from './Misc.jsx';
import Login from 'hooru';
import StripeCheckout from 'react-stripe-checkout';
import {XId,uid} from 'wwutils';
import {Text} from 'react-bootstrap';
import {Check}

export default class GiftAidForm extends React.Component {

	render() {
		return (
		<div>
			<input type="checkbox" > Yes, add Gift Aid
			<a href='https://www.cafonline.org/my-personal-giving/plan-your-giving/individual-giving-account/how-does-it-work/gift-aid'
>Find out more about Gift Aid</a>

Please tick all the following to confirm your donation is eligible for Gift Aid

I confirm that I am a UK taxpayer and I understand that if I pay less Income Tax and/or Capital Gains Tax in the current tax year than 
the amount of Gift Aid claimed on all my donations it is my responsibility to pay the difference. 

This is my own money. I am not paying in donations made by a third party e.g. money collected at an event, in the pub, 
a company donation or a donation from a friend or family member.

I am not receiving anything in return for my donation e.g. book, auction prize, ticket to an event.

I am not making a donation as part of a sweepstake, raffle or lottery.
		</div>);
	}
};
