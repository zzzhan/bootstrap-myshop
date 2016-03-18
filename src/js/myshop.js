(function(factory){
  "use strict";
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (window.jQuery) {
    factory(window.jQuery);
  }	
})(function($){
  var __units=null,
  renders={
    quantity:function(row){
	  var text = row.quantity;
	  if(!!__units) {
		text = row.quantity+__units[row.unit_id+''];
	  }
	  return text;
	},
	unitprice: function(row) {
	  var text = '￥'+(row.price);
	  if(!!__units) {
		text +='&nbsp;/&nbsp;'+__units[row.unit_id+''];
	  }
	  return text;	  
	},
	amount: function(row){
	  return '￥'+(row.quantity*row.price);
	}
  },header=[{key:'name'},{key:'price',
	renderer:renders.unitprice}
  ],  
  prodMngTable = $('.ms-prod-table').mytable({selectabled:true,header:[{key:'id',text:'#'},
	{key:'name',editabled:true},{key:'price',editabled:true,type:'float',
	renderer:renders.unitprice},
	{key:'def_quantity',editabled:true,type:'float'}]}).on('edit',
	function(e, row, col, old){
	  var el = $(this);
	  $.ajax({method:'put',
	  url:'/api/prods/'+row.id,
	  data:row,
	  error: function(resp) {
		el.mytable('reset');
	  }
	  })
	}),
  prodSelector = $('#prodSelector').mytable({header:header}).on('dblclick', 'tbody tr', function(e){
	e.preventDefault(); 
	e.stopPropagation();
	var row = $(e.currentTarget).data('row'),
	rows = txnContainer.data(),found=false;
	for(var i=0;i<rows.length;i++) {
	  var r=rows[i];
	  if(r.id===row.id) {
		r.quantity+=row.def_quantity;
		txnContainer.update(i);
		found = true;
		break;
	  }
	}
	if(!found) {
	  var clone={quantity:row.def_quantity};
	  $.extend(clone,row);
	  txnContainer.insert(clone);
	}
  }).data('mytable');
  var txnTableOpt = {selectabled:true,header:header.concat([
	{key:'quantity',editabled:true,type:'float',renderer:renders.quantity},
	{key:'amount',renderer:renders.amount}
  ])},
  txnContainer = $('.ms-txn-table').mytable(txnTableOpt).on('update', function(){
	var data = txnContainer.data(),amt=0;
	for(var i=0;i<data.length;i++) {
	  var it = data[i];
	  amt+=it.quantity*it.price;
	}
	$('#sum_amt').val(amt);
  }).data('mytable'),
  txnQueryTable = $('#txnQueryTable').mytable({header:[
	{key:'cust_name'},
	{key:'txn_amt',renderer:function(row){return '￥'+row.txn_amt;}},
	{key:'remark'},
	{key:'txn_date'},
	{key:'txn_detail',renderer:function(row,i){
	  return '<a href="#" class="btn btn-default btn-xs" data-toggle="modal" data-target="#ms-txndetail-dlg"  data-index="'+i+'">明细</a>';
	}}
  ]});
  $('#ms-txndetail-dlg').on('show.bs.modal', function (event) {
      var button = $(event.relatedTarget);
	  var row = txnQueryTable.data('mytable').data()[button.data('index')],
	  jarr = JSON.parse(row.txn_detail);
	  $('#txnDetailTable').mytable('data',jarr);
  }).find('#txnDetailTable').mytable({header:header.concat([
	{key:'quantity',renderer:renders.quantity},
	{key:'amount',renderer:renders.amount}
  ])});
  $('.ms-txnquery-form').myform().on('mf.submited', function(e,resp){
	txnQueryTable.mytable('data', resp.data);
  });
  $('#query .input-daterange').datepicker({format: "yyyy-mm-dd"});
  $('.ms-txn-form').myform().on('mf.submit', function(){
	var fm=$(this),txnDetail = JSON.stringify(txnContainer.data());
	$('input[name=txn_details]', fm).val(txnDetail);	  
  }).on('mf.submited', function(e,resp){
	this.reset();
	txnContainer.removeAll();
	console.log(resp);
  });
  $('.ms-addprod-form').myform().on('mf.submited', function(e,resp){
	var data=resp.data,row={id:data[2].insertId};
	$(':input', $(this)).each(function(){
	  row[this.name]=this.value;
	});
	if(data[0].length===0) {
	  row.unit_id=data[1].insertId;
	  __units[row.unit_id+''] = row.unit_name;
	}
	prodMngTable.mytable('insert', row);
	prodSelector.refresh();
	this.reset();
  });
  var loadUnits = function(callback) {
	  $.getJSON('/api/prods/units', function(resp){
	  var units = {},data=resp.data;
	  for(var i=0;i<data.length;i++) {
		var item = data[i];
		units[item.id+''] = item.name;
	  }
	  __units = units;
	  $('.mylist-units').mylist({
		  renderer:function(item) {
			return item.name;
		  }
	  }).mylist('init',data).on('selected', function(e, item) {
		 var fm = $('.ms-addprod-form')[0];
		 fm.unit_id.value=item.id;
		 fm.unit_name.value=item.name;
	  });
	  if(typeof callback==='function') {
		callback(data);
	  }
	});
  }
  $.post('/api/auth/signin', {login:'jinghao',password:'hao1234'}, function(){
	loadUnits();
	$.getJSON('/api/prods', function(resp){
		prodSelector.data(resp.data);
		prodMngTable.mytable('data', resp.data);
	});
	$.getJSON('/api/cust', function(resp){
	  var data = resp.data;
	  $('.mylist-customers').mylist({
		  renderer:function(item) {
			return item.name;
		  }
	  }).mylist('init',data).on('selected', function(e, item) {
		 var fm = $('.ms-txn-form')[0];
		 fm.cust_id.value=item.id;
		 fm.cust_name.value=item.name;
	  });
	});
  }, "json");	
  $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
	var ishome = $(e.target).is('a[href="#home"]');
	if(ishome) {
      $.getJSON('/api/prods', function(resp){
		prodSelector.data(resp.data);
	  });	  
	}
  });
  $(document).bind('keydown',
	function(e){
	var hit=false,key=e.key.toUpperCase();
	  if(!$(e.target).is('[contenteditable=true]')) {
		switch(key) {
		  case 'A':
			if(!!e.ctrlKey) {
			  $('.table', $('.tab-pane.active')).mytable('select');
			  hit = true;
			}
		  break;
		  case 'DELETE':
		  case 'BACKSPACE':
			if(!$(e.target).is('input')) {
			  var mytable = $('.table[data-del-row=true]', $('.tab-pane.active')),
			  acturl = mytable.data('action'),
			  del=mytable.data('del-row');
			  if(!!del) {
			    var rows = mytable.data('mytable').selecteds();
				if(!!acturl&&rows.length>0) {
				  $.ajax({method:'delete',
				  url:acturl+'/'+mytable.data('mytable').uuid(rows[0]),
				  success: function() {
					mytable.mytable('remove',rows);
				  }
				  });
				} else {
			      mytable.mytable('remove', rows);
			   }
			  }
			  hit = true;
			}
		  break;		  
		}
		if(hit) {
			e.preventDefault(); 
			e.stopPropagation();
		}
	  }
	//console.log(e);
	});
});