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
	},
	type: function(row) {
	  return __types[row.type_id+'']||'';
	}
  },  
  prodMngTable = $('.ms-prod-table').mytable({selectabled:true,header:[{key:'id',text:'#'},
	{key:'type_id',renderer:renders.type},
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
	}).on('dblclick', 'tbody tr', function(e){
	  var mytable = $(e.delegateTarget),
	  ind=$('tbody tr', mytable).index(e.currentTarget),
	  row = mytable.data('mytable').data()[ind];
	  row.type_name=__types[row.type_id+''];
	  row.unit_name=__units[row.unit_id+''];
	  var fm = $('.ms-addprod-form')[0];
	  setForm(fm, row)['name'].focus();
	  $('[type="submit"]',fm).text('更新');
	}),
  prodSelectTable = $('.ms-prod-select-table').mytable({header:[{key:'type_id',renderer:renders.type},{key:'name'},{key:'price',
	renderer:renders.unitprice}
  ]}).on('dblclick', 'tbody tr', function(e){
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
  }),
  prodSelector=prodSelectTable.data('mytable');
  var txnTableOpt = {selectabled:true,header:[{key:'name'},{key:'price',
	renderer:renders.unitprice},
	{key:'quantity',editabled:true,type:'float',renderer:renders.quantity},
	{key:'amount',renderer:renders.amount}
  ]},
  txnContainer = $('.ms-txn-table').mytable(txnTableOpt).on('update', function(){
	var data = txnContainer.data(),amt=0;
	for(var i=0;i<data.length;i++) {
	  var it = data[i];
	  amt+=it.quantity*it.price;
	}
	$('#txn_amt').val(amt);
  }).data('mytable'),
  txnQueryTable = $('#txnQueryTable').mytable({selectabled:true,header:[
	{key:'cust_name'},
	{key:'txn_amt',renderer:function(row){return '￥'+row.txn_amt;}},
	{key:'cust_addr'},
	{key:'remark'},
	{key:'txn_date'},
	{key:'txn_detail',renderer:function(row,i){
	  return '<div class="btn-group btn-group-xs" role="group"><button class="btn btn-default btn-xs" data-toggle="modal" data-target="#ms-txndetail-dlg"  data-index="'+i+'">明细</button><button class="btn btn-default btn-xs" data-ms-action="modify" data-index="'+i+'">修改</button><button class="btn btn-default btn-xs" data-ms-action="copy" data-index="'+i+'">复制</button></div>';
	}}
  ]}).on('click', 'button', function(e){
	  var btn = $(e.target),row=null;
	  switch(btn.data('ms-action')) {
		case 'modify':
		row = $(e.delegateTarget).data('mytable').data()[btn.data('index')];
		setTxnForm(row);
		break;
		case 'copy':
		row = $(e.delegateTarget).data('mytable').data()[btn.data('index')];
		setTxnForm(row).id.value='';
		break;
	  }
  });
  var setTxnForm = function(row) {
	var fm = $('.ms-txn-form')[0];
	setForm(fm, row);
	$('.ms-txn-table').mytable('data', JSON.parse(row.txn_detail));
	$('#myTabs a[href="#home"]').tab('show');
    return fm;	
  },
  setForm = function(fm, row) {
	for(var k in row) {
	  if(!!fm[k]) {
		fm[k].value=row[k];
	  }
	}
	return fm;
  };
  $('#ms-txndetail-dlg').on('show.bs.modal', function (event) {
      var button = $(event.relatedTarget);
	  var row = txnQueryTable.data('mytable').data()[button.data('index')],
	  jarr = JSON.parse(row.txn_detail);
	  $('#txnDetailTable').mytable('data',jarr);
  }).find('#txnDetailTable').mytable({header:[{key:'name'},{key:'price',
	renderer:renders.unitprice},
	{key:'quantity',renderer:renders.quantity},
	{key:'amount',renderer:renders.amount}
  ]});
  $('.ms-txnquery-form').myform().on('mf.submited', function(e,resp){
	txnQueryTable.mytable('data', resp.data);
  });
  $('#query .input-daterange').datepicker({format: "yyyy-mm-dd",autoclose: true,
    todayHighlight: true});
  $('#txn_date').datepicker({format: "yyyy-mm-dd",
    "autoclose": true}).datepicker("setDate", new Date());
  $('.ms-txn-form').myform().on('mf.submit', function(){
	var fm=$(this),txnDetail = JSON.stringify(txnContainer.data());
	$('input[name=txn_details]', fm).val(txnDetail);	  
  }).on('mf.submited', function(e,resp){
	this.reset();
	txnContainer.removeAll();
  });
  $('.ms-addprod-form').myform().on('mf.submited', function(e,resp){
	  var row = resp.data,
	  rows = prodMngTable.data('mytable').data(),
	  flag = false;
	  for(var i=0;i<rows.length;i++) {
		if(rows[i].id===row.id){
		  rows[i]=row;
		  flag = true;
		  break;
		}
	  }
	  __units[row.unit_id+''] = row.unit_name;
	  __types[row.type_id+''] = row.type_name;
	  if(flag) {
	    prodMngTable.mytable('refresh');		  
	  }else {
		prodMngTable.mytable('insert', row);
	  }
	prodSelector.refresh();
	this.reset();
	$('[type="submit"]',this).text('新增');
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
  };
  var loadTypes = function(callback) {
	  $.getJSON('/api/prods/types', function(resp){
	  var types = {},data=resp.data;
	  for(var i=0;i<data.length;i++) {
		var item = data[i];
		types[item.id+''] = item.name;
	  }
	  __types = types;
	  $('.mylist-types').mylist({
		  renderer:function(item) {
			return item.name;
		  }
	  }).mylist('init',data).on('selected', function(e, item) {
		  var ul = $(e.target);
		  switch(ul.attr('id')) {
			case 'prod_type_query':
			$.get('/api/prods', {q:item.id}, function(resp){
				prodMngTable.mytable('data', resp.data);
			});
			break;
			case 'prod_type_select':
			$.get('/api/prods', {q:item.id}, function(resp){
			  prodSelectTable.mytable('data', resp.data);
			});
			break;
			case 'prod_type_add':
			  var fm = $('.ms-addprod-form')[0];
			  fm.type_id.value=item.id;
			  fm.type_name.value=item.name;
			break;
			
		  }
	  });
	  if(typeof callback==='function') {
		callback(data);
	  }
	});
  };
  $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
	var ishome = $(e.target).is('a[href="#home"]');
	if(ishome) {
      $.getJSON('/api/prods', function(resp){
		prodSelector.data(resp.data);
	  });
	}
  });
  $('input[name="q"]').on('change', function() {
	var input = $(this);
    $.getJSON('/api/prods', {q:input.val()}, function(resp){
	  $('#'+input.data('ms-target')).mytable('data', resp.data);
	});
  });
  $(document).on('click', 'button', function(e){
	var btn = $(e.target);
	if(btn.is('.ms-btn-prod-type')) {
      $.getJSON('/api/prods', function(resp){		
	    $('#'+btn.data('ms-target')).mytable('data', resp.data);
	  });
	}
  }).bind('keydown',
	function(e){
	var hit=false,key=e.key.toUpperCase();
	  if(!$(e.target).is('[contenteditable=true]')) {
		switch(e.which) {
		  case 65://A key
			if(!!e.ctrlKey) {
			  $('.table', $('.tab-pane.active')).mytable('select');
			  hit = true;
			}
		  break;
		  case 46://DELETE key
			if(!$(e.target).is('input')) {
			  var mytable = $('.table[data-del-row=true]', $('.tab-pane.active')),
			  acturl = mytable.data('action'),
			  del=mytable.data('del-row');
			  if(!!del) {
			    var rows = mytable.data('mytable').selecteds();
				if(!!acturl&&rows.length>0) {
				  $.ajax({method:'delete',
				  url:acturl+'/'+mytable.data('mytable').rowId(rows[0]),
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
	}).ready(function(){
	  $.post('/api/auth/signin', {login:'jinghao',password:'hao1234'}, function(){
		loadUnits(function(){
		  loadTypes(function(){
			$.getJSON('/api/prods', function(resp){
				prodSelector.data(resp.data);
				prodMngTable.mytable('data', resp.data);
			});
		  });		
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
			 fm.cust_addr.value=item.addr||'';
		  });
		});
	  }, "json");
	});
});