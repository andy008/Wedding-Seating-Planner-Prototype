AppModel = Backbone.Model.extend({
	
	
	initialize: function(attrs) {
		_.bindAll(this, 'shapeSuccess', 'guestSuccess');
		
		this.units = new Units();
		
		this.shapes = new ShapeList([], { units: this.units });	
		this.shapes.url = attrs.shapesURL;	
		
		this.guests = new GuestList();
		this.guests.url = attrs.guestsURL;
		
		this.editShape = new Furniture({ name: 'Table 1', units: this.units, seatOffset:0.6, buffer:3.5 });		
		
		this.editModel = new EditShapeWithGuests({ editShape: this.editShape, guests: this.guests, shapes: this.shapes, units: this.units});
		this.editRouter = new EditShapeWithGuestsRouter({ model: this.editModel });
		
		this.roomContainer = new RoomContainer({ units: this.units });
	
	},
	
	load: function () {
		if (!this.shapes) return;
		
		this.shapes.fetch({ success: this.shapeSuccess });
	},
	
	shapeSuccess: function(collection, response) {
		if (!this.guests) return;
		
		this.guests.fetch({ success: this.guestSuccess });
	},
	
	guestSuccess: function(collection, response) {
		//console.log(collection, this.guests);
		if (!this.guests) return;
		
		this.guests.each( function(guest) {
			//console.log(guest);
			var tableId = guest.get('tableId'),
				seatSlot = guest.get('seatSlot'),
				table, seat;
			
			if ( tableId && seatSlot ) {
				
				table = this.shapes.find( function(shape){
					return shape.get('id') === tableId;
				});
			
				if (table) {
					//console.log('table');
					seat = table.seats.find(function(s){ 
						//console.log(s.get('slot'), seatSlot, _.isEqual(s.get('slot'), seatSlot))
						return _.isEqual(s.get('slot'), seatSlot);
					});
					
					if (seat) {
						//console.log('seat')
						seat.setGuest(guest)
					}
				}
			}
		}, this);
	},
	
	removeShape: function(shape) {
		console.log('[SeatingPlannerAppModel] removeShape');
		var that = this;
		
		if (shape) {
			if (shape.seats) {			
				shape.seats.each(this.removeGuestFromSeat);
			}
			//this.shapes.remove(shape);
			shape.destroy();
		}
	},
	
	removeShapeByID: function (id) {		
		console.log('[SeatingPlannerAppModel] removeShapeByID', id);
		if ( !this.shapes || !this.shapes.getByCid(id)) return;	
		this.removeShape(this.shapes.getByCid(id));
	},
	
	duplicateShapeByID : function (cid) {
		console.log('[SeatingPlannerAppModel] duplicateShapeByID', cid, (!this.shapes || !this.shapes.getByCid(cid)));
		
		if ( !this.shapes || !this.shapes.getByCid(cid)) return;
		
		var order = this.shapes.nextOrder(),
		name = 'Table '+order,
		id = 'table'+ order,
		et = this.shapes.getByCid(cid),
		etJSON = et.toJSON();
		
		var table = new Furniture({
				id: id,
				x: etJSON.x,
				y: etJSON.y,
				units: this.units,
				name: name,
				order: order,
				type: etJSON.type,
				buffer: etJSON.buffer,
				width: etJSON.width,
				height: etJSON.height,
				elbowRoom: etJSON.elbowRoom,
				footprintWidth: etJSON.footprintWidth,
				footprintHeight: etJSON.footprintHeight,
				scaleX: et.get('scaleX'), 
				scaleY: et.get('scaleY'),				
				seatSlots: etJSON.seatSlots.concat()
		
		});
		
		this.shapes.add(table);
			
		//table.save();
		
	},
	
	clearShapes : function () {
		console.log('[SeatingPlannerAppModel] removeAllShapes', this.shapes.length);
	
		while (this.shapes && this.shapes.length) {
			this.removeShape(this.shapes.last());
		}		
	},
	
	removeGuestFromSeat: function (seat) {
		console.log('[EditShapeModel] removeGuestFromSeat');		
		
		var guest;
		
		if (seat && (guest = seat.get('guest'))) { 
			console.log('	[EditShapeModel] removeGuestFromSeat', guest.get('label'));			
			seat.unsetGuest(guest);	
			console.log('guest.changedAttributes()', guest.changedAttributes())	
		}		
		
	}
	
	
});