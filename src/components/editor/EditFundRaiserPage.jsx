import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert, assMatch} from 'sjtest';
import Login from 'you-again';
import {encURI} from 'wwutils';
import ActionMan from '../../plumbing/ActionMan';
import DataStore from '../../plumbing/DataStore';
import C from '../../C';
import Roles from '../../Roles';

import Misc from '../Misc';
import FundRaiser from '../../data/charity/FundRaiser';

const EditFundRaiserPage = () => {

	// which event?	
	let path = DataStore.getValue(['location','path']);
	let id = path[1];
	if (id) return <FundRaiserEditor id={id} />;

	return (
		<div className=''>
			<h2>Edit your fundraiser (later)</h2>
		</div>
	);
};

const FundRaiserEditor = ({id}) => {
	assMatch(id, String);
	let type = C.TYPES.FundRaiser;
	let pEvent = ActionMan.getDataItem({type, id, status: C.KStatus.DRAFT});
	if ( ! pEvent.value) {
		return <Misc.Loading />;
	}
	console.warn("pEvent", pEvent.value);
	let item = pEvent.value;
	FundRaiser.assIsa(item);	

	// TODO charity reuses register form control

	const path = ['data', type, id];
	const peepPath = path.concat('owner');

	return (<div>
		<h2>Fundraiser {item.name || id} </h2>		
		<p className='CTA'><a href={'#fundraiser/'+encURI(id)}>Go to Your FundRaiser Page</a></p>
		<p><small>ID: {id}</small></p>
		<p><small>Owner: {FundRaiser.oxid(item)}</small></p>
		<p><small>Event: {FundRaiser.eventId(item)}</small></p>
		<Misc.PropControl path={path} prop='name' item={item} label='Fundraiser Name' />
		<Misc.PropControl path={path} prop='description' item={item} label='Description' />
		<Misc.PropControl path={path} prop='charityId' item={item} label='Charity' />
		<Misc.PropControl path={peepPath} prop='name' label='Your Name' />
		<Misc.PropControl path={peepPath} prop='img' label='Your Photo' type='img' />
		<Misc.PropControl path={peepPath} prop='description' label='About You' type='textarea' />
		<Misc.PropControl path={path} prop='story' item={item} label='Your Story' type='textarea' />
		<Misc.SavePublishDiscard type={type} id={id} />
	</div>);
};

export default EditFundRaiserPage;
