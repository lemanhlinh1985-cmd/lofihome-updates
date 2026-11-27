(function(root){
  'use strict';
  var ids=['duc_009','duc_010','duc_012','duc_011','duc_030','duc_029','duc_031'].map(function(id){return 'cutout_patterns__'+id;});
  var photoIds=['dong_tien_trien_vuong','dong_tien_may_cuon','trien_vuong','may_cuon','thanh_gia_day_la','la_cuon'].map(function(id){return 'borders__anh_'+id;});
  var pairedId='borders__bien_goc_10';
  ids=ids.concat(photoIds,[pairedId]);
  function isBorder(id){return ids.indexOf(id)>=0;}
  function number(value,min,max,label){var n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(label+(min===0?' cần là số không âm.':' cần là số lớn hơn 0.'));return n;}
  function normalize(value){
    if(!value || typeof value!=='object' || !isBorder(value.id))throw Error('Chọn một mẫu trong nhóm Chạy viền.');
    var b={id:value.id,enabled:value.enabled!==false,width:number(value.width,Number.MIN_VALUE,Infinity,'Rộng dải viền'),module:number(value.module,Number.MIN_VALUE,Infinity,'Cỡ mẫu viền'),gap:number(value.gap,value.id===pairedId?0:Number.MIN_VALUE,Infinity,'Khe giữa mẫu viền')};
    if(photoIds.indexOf(value.id)>=0){
      if(value.photo_fit!==undefined && typeof value.photo_fit!=='boolean')throw Error('Lựa chọn giữ trọn mẫu không hợp lệ.');
      b.photo_fit=value.photo_fit!==false;
    }
    if(Object.prototype.hasOwnProperty.call(value,'join_equal')){
      if(typeof value.join_equal!=='boolean')throw Error('Lựa chọn nối bằng nan không hợp lệ.');
      b.join_equal=value.join_equal;
    }
    ['top','bottom','left','right'].forEach(function(side){
      var key='omit_'+side;
      if(value[key]!==undefined){
        if(typeof value[key]!=='boolean')throw Error('Lựa chọn bỏ riềm không hợp lệ.');
        b[key]=value[key];
      }
    });
    if(value.edge_frame!==undefined){
      var edge=value.edge_frame;
      if(!edge || typeof edge!=='object' || Array.isArray(edge))throw Error('Thông số viền bao diềm không hợp lệ.');
      if(edge.enabled!==undefined && typeof edge.enabled!=='boolean')throw Error('Lựa chọn bỏ viền không hợp lệ.');
      b.edge_frame={enabled:edge.enabled!==false};
      ['outer','inner'].forEach(function(k){
        if(edge[k]===null || edge[k]==='' || typeof edge[k]==='boolean')throw Error('Nhập bề rộng viền bao diềm hợp lệ.');
        b.edge_frame[k]=edge[k]===undefined ? 10 : number(edge[k],0,Infinity,'Bề rộng viền bao diềm');
      });
    }
    if(value.stroke_adjust!==undefined){
      if(value.stroke_adjust===null || value.stroke_adjust==='' || typeof value.stroke_adjust==='boolean')throw Error('Nhập mức bù nét diềm hợp lệ.');
      b.stroke_adjust=number(value.stroke_adjust,-Infinity,Infinity,'Bù nét diềm');
    }
    if(value.layout!==undefined){
      var layout=value.layout;
      if(!layout || typeof layout!=='object' || Array.isArray(layout) || (layout.enabled!==undefined && typeof layout.enabled!=='boolean'))throw Error('Thông số khổ diềm riêng không hợp lệ.');
      b.layout={enabled:layout.enabled===true};
      ['width','height'].forEach(function(k){
        if(layout[k]===null || layout[k]==='' || typeof layout[k]==='boolean')throw Error('Nhập ngang và cao khổ diềm riêng hợp lệ.');
        b.layout[k]=number(layout[k]===undefined ? (k==='width'?650:1500) : layout[k],Number.MIN_VALUE,Infinity,'Khổ diềm riêng');
      });
    }
    if(value.center_mode!==undefined){
      if(['inherit','pattern','hollow','solid'].indexOf(value.center_mode)<0)throw Error('Chế độ phần giữa không hợp lệ.');
      b.center_mode=value.center_mode;
    }
    if(value.inner_frame!==undefined){
      var f=value.inner_frame;
      if(!f || typeof f!=='object' || typeof f.equal!=='boolean')throw Error('Thông số viền trong không hợp lệ.');
      b.inner_frame={equal:f.equal};
      ['width','left','right','top','bottom'].forEach(function(k){
        if(f[k]===null || f[k]==='' || typeof f[k]==='boolean')throw Error('Nhập rộng viền trong hợp lệ.');
        b.inner_frame[k]=number(f[k],0,Infinity,'Rộng viền trong');
      });
    }
    if(b.gap>=b.width || b.gap>=b.module)throw Error('Khe viền phải nhỏ hơn dải viền và cỡ mẫu.');
    return b;
  }
  function add(a,b){return [a[0]+b[0],a[1]+b[1]];}
  function sub(a,b){return [a[0]-b[0],a[1]-b[1]];}
  function mul(a,t){return [a[0]*t,a[1]*t];}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1];}
  function cross(a,b){return a[0]*b[1]-a[1]*b[0];}
  function length(a){return Math.hypot(a[0],a[1]);}
  function lerp(a,b,t){return add(mul(a,1-t),mul(b,t));}
  function hasOmissions(b){return ['top','bottom','left','right'].some(function(s){return b['omit_'+s]===true;});}
  function allOmitted(b){return ['top','bottom','left','right'].every(function(s){return b['omit_'+s]===true;});}
  // Directions refer to the panel's XY axes, including captured outlines.
  function sideOf(direction){
    var x=direction[1],y=-direction[0];
    return Math.abs(x)>Math.abs(y) ? (x>0?'right':'left') : (y>0?'top':'bottom');
  }
  function activeBand(r,b,U,protectInnerCorners){
    if(!hasOmissions(b))return r.band;
    var cells=r.segments.filter(function(s){return !b['omit_'+s.side];}).map(function(s){return [s.a,s.b,s.d,s.c];});
    r.corners.forEach(function(c){if(c.sides[protectInnerCorners?'some':'every'](function(s){return !b['omit_'+s];}))cells.push(c.loop);});
    return U.bool(U.toPaths(cells),[],'union');
  }
  function activeRuns(r,b){
    if(!hasOmissions(b))return r.runs;
    var out=[];
    r.runs.forEach(function(run){
      var segments=run.segments;
      if(segments.every(function(s){return !b['omit_'+s.side];})){out.push(run);return;}
      // Open a closed curved contour at an omitted segment, then group only
      // adjacent retained segments. No motif crosses an omitted side.
      if(run.closed){var cut=segments.findIndex(function(s){return b['omit_'+s.side];});segments=segments.slice(cut+1).concat(segments.slice(0,cut+1));}
      var chunk=[];
      function flush(){
        if(!chunk.length)return;
        var total=0,list=chunk.map(function(s){var copy=Object.assign({},s,{start:total});total+=s.length;return copy;});
        out.push({segments:list,length:total,closed:false,startVertex:list[0].vertex,endVertex:list[list.length-1].endVertex});chunk=[];
      }
      segments.forEach(function(s){if(b['omit_'+s.side])flush();else chunk.push(s);});flush();
    });
    return out;
  }
  function centerWithSides(outer,width,b,U){
    if(allOmitted(b))return U.toPaths([outer]);
    var r=ring(outer,width,U);
    return U.bool(U.toPaths([outer]),activeBand(r,b,U,true),'difference');
  }
  function edgeFrame(info,input,U){
    var f=input.edge_frame || {enabled:true,outer:10,inner:10},out=[];
    if(!f.enabled || !info.band.length)return out;
    var cap=Math.max(f.outer,f.inner);
    info.envelopes.forEach(function(e){
      var kept=U.bool(e.kept,info.band,'intersection');
      if(!kept.length)return;
      if(f.inner && !U.offset(e.inner,-f.inner).length)throw Error('Viền trong quá rộng làm hết khoảng trống. Giảm bề rộng viền trong.');
      var enlargedOuter=f.outer ? U.offset(kept,f.outer) : kept;
      var enlargedInner=f.inner ? U.offset(kept,f.inner) : kept;
      // Add material only outside the untouched motif envelope. The two
      // radial sides use independent widths; exposed ends use the larger.
      var outerRim=U.bool(enlargedOuter,e.outer,'difference');
      var innerRim=U.bool(enlargedInner,e.inner,'intersection');
      var endLoops=[];
      if(cap)e.ends.forEach(function(end){
        var radial=sub(end.c,end.a),norm=length(radial);radial=mul(radial,1/norm);
        var a=add(end.a,mul(radial,-f.outer)),c=add(end.c,mul(radial,f.inner));
        var loop=[a,c,add(c,mul(end.tangent,cap)),add(a,mul(end.tangent,cap))];
        if(cross(sub(c,a),end.tangent)<0)loop.reverse();
        endLoops.push(loop);
      });
      var endRim=U.toPaths(endLoops);
      out=out.concat(outerRim,innerRim,endRim);
    });
    var frame=U.bool(U.bool(out,[],'union'),info.band,'difference');
    if(info.material_repeat && frame.length){
      // Avoid a degenerate coincident seam in traced art. Only overlap the
      // existing support band by two integer geometry units (0.0002 mm);
      // the outside footprint and all requested physical rim widths stay put.
      var support=U.bool(info.band,frame,'union');
      frame=U.bool(U.offset(frame,.0002),support,'intersection');
    }
    return frame;
  }
  function cleanPhotoCornerFragments(info,body,rim,U){
    if(!info.material_repeat || !rim.length || !info.mitres.length)return body;
    var kept=[],removed=0;
    U.parts(body).forEach(function(part){
      var paths=U.toPaths([part.outer].concat(part.holes));
      var atMitre=part.outer.some(function(p){return info.mitres.some(function(line){
        var d=sub(line.c,line.a),v=sub(p,line.a),l=length(d),t=dot(v,d)/(l*l);
        return t>=-.00001 && t<=1.00001 && Math.abs(cross(v,d))/l<.0003;
      });});
      // A diagonal mitre can slice a tiny disconnected chip from a traced
      // flourish. Drop only those clipped corner chips that touch no rim;
      // whole motifs, cap ends and all bare-photo geometry remain unchanged.
      if(atMitre && Math.abs(U.area(U.bool(paths,rim,'intersection')))<1e-9){removed++;return;}
      kept=kept.concat(paths);
    });
    info.corner_trimmed_count=removed;
    return kept;
  }
  function adjustFootprint(info,amount,U){
    if(!amount)return;
    // Changing the cut width also moves its extreme edges. Move the support
    // boundary by the same distance, so no new solid rail is left behind.
    var delta=amount/2;
    info.band=U.offset(info.band,-delta);
    info.envelopes.forEach(function(e){
      e.kept=U.offset(e.kept,-delta);
      e.outer=U.offset(e.outer,-delta);
      e.inner=U.offset(e.inner,delta);
      e.ends=e.ends.map(function(end){
        var radial=sub(end.c,end.a),norm=length(radial);radial=mul(radial,1/norm);
        return {a:add(add(end.a,mul(radial,delta)),mul(end.tangent,-delta)),c:add(add(end.c,mul(radial,-delta)),mul(end.tangent,-delta)),tangent:end.tangent};
      });
    });
  }
  function ring(outer,width,U){
    var G=U.G,p=G.validateLoop(outer,'Viền trong'),n=p.length;
    if(G.area(p)<0)p=p.slice().reverse();
    var dirs=p.map(function(a,i){var v=sub(p[(i+1)%n],a);return mul(v,1/length(v));});
    // Intersect adjacent inward parallel lines. Keeping corresponding vertices
    // gives nonoverlapping mitre sectors and a continuous curved-band mapping.
    var q=p.map(function(a,i){
      var u=dirs[(i+n-1)%n],v=dirs[i],normal=[-v[1],v[0]],den=cross(u,v);
      if(Math.abs(den)<1e-8){if(dot(u,v)<0)throw Error('Viền có cạnh quay ngược.');return add(a,mul(normal,width));}
      var x=add(a,mul([-u[1],u[0]],width)),y=add(a,mul(normal,width));
      return add(x,mul(u,cross(sub(y,x),v)/den));
    });
    try{G.validateLoop(q,'Viền phía trong dải hoa văn');}catch(e){throw Error('Dải viền quá rộng tại góc hoặc đoạn hẹp. Giảm Rộng dải viền.');}
    var outerPaths=U.toPaths([p]),innerPaths=U.toPaths([q]);
    if(G.area(q)<=0 || Math.abs(U.area(U.bool(innerPaths,outerPaths,'difference')))>.001)throw Error('Dải viền vượt vùng trong của tấm. Giảm Rộng dải viền.');
    var segments=[],sectors=[],sum=0;
    p.forEach(function(a,i){
      var j=(i+1)%n,centerA=lerp(a,q[i],.5),centerB=lerp(p[j],q[j],.5),len=length(sub(centerB,centerA));
      if(len<.001 || dot(sub(q[j],q[i]),dirs[i])<=.001)throw Error('Dải viền làm mất một cạnh ngắn. Giảm Rộng dải viền.');
      var sector=[a,p[j],q[j],q[i]];
      if(G.area(sector)<=0)throw Error('Dải viền bị gập tại góc. Giảm Rộng dải viền.');
      sectors.push(sector);sum+=U.area(U.toPaths([sector]));
      segments.push({a:a,b:p[j],c:q[i],d:q[j],length:len,side:sideOf(dirs[i]),vertex:i,endVertex:j});
    });
    var band=U.bool(outerPaths,innerPaths,'difference'),joined=U.bool(U.toPaths(sectors),[],'union');
    if(Math.abs(U.area(joined)-sum)>.01 || Math.abs(U.area(U.bool(joined,band,'difference')))>.01 || Math.abs(U.area(U.bool(band,joined,'difference')))>.01)throw Error('Các nhánh viền chồng nhau. Giảm Rộng dải viền.');
    var corners=[];
    dirs.forEach(function(d,i){if(dot(d,dirs[(i+n-1)%n])<Math.cos(Math.PI/12))corners.push(i);});
    // Reserve one whole square at every right-angle turn. A motif must never
    // be stretched into either of the two triangular mitre sectors.
    var squareCorners=[],orthogonal={};
    corners.forEach(function(i){
      if(Math.abs(dot(dirs[i],dirs[(i+n-1)%n]))>1e-7)return;
      var d=dirs[i],normal=[-d[1],d[0]],shift=Math.min(0,dot(sub(q[i],p[i]),d)),origin=add(p[i],mul(d,shift));
      orthogonal[i]=true;
      squareCorners.push({vertex:i,sides:[sideOf(dirs[(i+n-1)%n]),sideOf(d)],concave:shift<0,origin:origin,direction:d,normal:normal,
        loop:[origin,add(origin,mul(d,width)),add(add(origin,mul(d,width)),mul(normal,width)),add(origin,mul(normal,width))]});
    });
    segments.forEach(function(s,i){
      var j=(i+1)%n,d=dirs[i],normal=[-d[1],d[0]],edgeLength=length(sub(p[j],p[i]));
      if(orthogonal[i]){
        s.a=add(p[i],mul(d,Math.max(0,dot(sub(q[i],p[i]),d))));
        s.c=add(s.a,mul(normal,width));
      }
      if(orthogonal[j]){
        s.b=add(p[i],mul(d,Math.min(edgeLength,edgeLength+dot(sub(q[j],p[j]),d))));
        s.d=add(s.b,mul(normal,width));
      }
      if(dot(sub(s.b,s.a),d)<=.001 || dot(sub(s.d,s.c),d)<=.001)throw Error('Không đủ chỗ cho mẫu nguyên ở góc. Giảm Rộng dải viền.');
      s.length=length(sub(lerp(s.b,s.d,.5),lerp(s.a,s.c,.5)));
    });
    var cells=segments.map(function(s){return [s.a,s.b,s.d,s.c];}).concat(squareCorners.map(function(c){return c.loop;}));
    var cellsPaths=U.toPaths(cells),cellsUnion=U.bool(cellsPaths,[],'union');
    if(Math.abs(U.area(cellsUnion)-cells.reduce(function(a,c){return a+U.area(U.toPaths([c]));},0))>.01 || Math.abs(U.area(U.bool(cellsUnion,band,'difference')))>.01 || Math.abs(U.area(U.bool(band,cellsUnion,'difference')))>.01)throw Error('Các mẫu góc chồng nhau. Giảm Rộng dải viền.');
    var starts=corners.length?corners:[0],runs=[];
    starts.forEach(function(start,k){
      var end=starts[(k+1)%starts.length],list=[],i=start,total=0;
      do{var s=Object.assign({start:total},segments[i]);list.push(s);total+=s.length;i=(i+1)%n;}while(i!==end);
      var run={segments:list,length:total,closed:!corners.length,startVertex:start,endVertex:end};
      if(list.length===1){
        var seg=list[0],direction=mul(sub(seg.b,seg.a),1/length(sub(seg.b,seg.a)));
        run.straight={direction:direction,width:width,left:dot(sub(seg.c,seg.a),direction),right:dot(sub(seg.d,seg.b),direction)};
        run.straight.blend=Math.min(total/2,Math.max(width,Math.abs(run.straight.left),Math.abs(run.straight.right)));
      }
      runs.push(run);
    });
    return {band:band,inside:innerPaths,runs:runs,corners:squareCorners,segments:segments};
  }
  function mapped(run,s,v){
    var list=run.segments,segment=list[list.length-1];
    if(run.straight){
      var f=run.straight,d=f.direction,center=lerp(lerp(segment.a,segment.c,.5),lerp(segment.b,segment.d,.5),s/run.length);
      var tangential=(v-.5)*(f.left*Math.max(0,1-s/f.blend)+f.right*Math.max(0,1-(run.length-s)/f.blend));
      // Straight-side motifs keep their original rectangular form. Only the
      // short end zones follow the mitre; do not shear an entire long side.
      return add(add(center,mul([-d[1],d[0]],(v-.5)*f.width)),mul(d,tangential));
    }
    for(var i=0;i<list.length;i++){if(s<=list[i].start+list[i].length+1e-8){segment=list[i];break;}}
    var t=Math.max(0,Math.min(1,(s-segment.start)/segment.length));
    return lerp(lerp(segment.a,segment.b,t),lerp(segment.c,segment.d,t),v);
  }
  function mapLoop(loop,data,run,start,span,width,gap){
    // The outer cut edge belongs on the captured/numeric frame boundary.
    // All spare radial space stays on the centre-pattern side of the band.
    var uv=loop.map(function(p){return [start+p[0]/data.width*span,p[1]/data.height*(width-gap)/width];}),out=[];
    // Split every source edge at contour vertices, then adaptively sample its
    // bilinear image. Straight sides stay exact; curves stay within 0.005 mm.
    function append(a,b,pa,pb,depth){
      var mid=lerp(a,b,.5),pm=mapped(run,mid[0],mid[1]);
      if(depth<12 && length(sub(pm,lerp(pa,pb,.5)))>.005){append(a,mid,pa,pm,depth+1);append(mid,b,pm,pb,depth+1);}else out.push(pa);
    }
    uv.forEach(function(a,i){
      var b=uv[(i+1)%uv.length],ts=[0,1],ds=b[0]-a[0];
      var knots=run.segments.slice(1).map(function(s){return s.start;});
      if(run.straight)knots=knots.concat([run.straight.blend,run.length-run.straight.blend]);
      if(Math.abs(ds)>1e-9)knots.forEach(function(s){var t=(s-a[0])/ds;if(t>1e-8&&t<1-1e-8)ts.push(t);});
      ts=ts.filter(function(t,i){return ts.indexOf(t)===i;});
      ts.sort(function(x,y){return x-y;});
      for(var j=0;j<ts.length-1;j++){var x=lerp(a,b,ts[j]),y=lerp(a,b,ts[j+1]);append(x,y,mapped(run,x[0],x[1]),mapped(run,y[0],y[1]),0);}
    });
    return out;
  }
  // Measure material strips between cuts, rather than the cut bounding boxes.
  // Keep those strips fixed while the empty parts absorb each side's remainder.
  // This piecewise affine map is strictly increasing, preserving every loop.
  function strokeGrid(source,axis){
    var values=function(a){return source.reduce(function(out,loop){return out.concat(loop.map(function(p){return p[a];}));},[]).filter(function(v,i,all){return all.indexOf(v)===i;}).sort(function(a,b){return a-b;});};
    var xs=values(axis),ys=values(1-axis),gaps=[],bins=[];
    source.forEach(function(loop){loop.forEach(function(a,i){var b=loop[(i+1)%loop.length];if(Math.abs(a[0]-b[0])>1e-6 && Math.abs(a[1]-b[1])>1e-6)throw Error('Mẫu này chưa hỗ trợ nối bằng nan. Bỏ chọn Nối bằng nan để dùng bố trí thường.');});});
    for(var i=1;i<ys.length;i++){
      var y=(ys[i-1]+ys[i])/2,weight=ys[i]-ys[i-1],crossings=[];
      source.forEach(function(loop){loop.forEach(function(a,j){var b=loop[(j+1)%loop.length];if((a[1-axis]>y)!==(b[1-axis]>y))crossings.push(a[axis]+(b[axis]-a[axis])*(y-a[1-axis])/(b[1-axis]-a[1-axis]));});});
      crossings.sort(function(a,b){return a-b;});
      for(var j=1;j<crossings.length-1;j+=2){
        var lo=crossings[j],hi=crossings[j+1],width=hi-lo;if(width<1e-5)continue;
        gaps.push({lo:lo,hi:hi,width:width});
        var bin=bins.find(function(b){return Math.abs(b.width-width)<.001;});
        if(!bin){bin={width:width,weight:0};bins.push(bin);}bin.weight+=weight;
      }
    }
    bins.sort(function(a,b){return b.weight-a.weight || a.width-b.width;});
    if(!bins.length)throw Error('Không đo được nan trong mẫu chạy viền.');
    var nominal=bins[0].width;
    // Original library drawings can differ by 1 mm between nominally equal
    // strips (e.g. 9/10 mm). Include that drafting variation in the same family.
    var narrow=gaps.filter(function(g){return Math.abs(g.width/nominal-1)<=.15;});
    var weights=xs.slice(1).map(function(x,i){var g=narrow.find(function(g){return xs[i]>=g.lo-1e-6 && x<=g.hi+1e-6;});return g ? (x-xs[i])/g.width : 0;});
    return {values:xs,weights:weights,gaps:narrow,nominal:nominal};
  }
  function strokeMap(grid,size,stroke){
    var xs=grid.values,fixed=grid.weights.reduce(function(a,b){return a+b;},0)*stroke;
    var free=xs.slice(1).reduce(function(sum,x,i){return sum+(grid.weights[i] ? 0 : x-xs[i]);},0),out=[0];
    if(free<=0 || size<=fixed)throw Error('Cạnh quá ngắn để giữ bề rộng nan. Giảm Cỡ mẫu tham chiếu hoặc Rộng dải viền.');
    xs.slice(1).forEach(function(x,i){
      var step=grid.weights[i] ? grid.weights[i]*stroke : (x-xs[i])*(size-fixed)/free;
      if(step<.25)throw Error('Khoảng rỗng của mẫu quá hẹp khi nối đều nan. Giảm Cỡ mẫu tham chiếu hoặc Rộng dải viền.');
      out.push(out[out.length-1]+step);
    });
    function at(x){var i=0;while(i<xs.length-2 && x>xs[i+1])i++;return out[i]+(x-xs[i])/(xs[i+1]-xs[i])*(out[i+1]-out[i]);}
    grid.gaps.forEach(function(g){if(Math.abs(at(g.hi)-at(g.lo)-stroke)>1e-6)throw Error('Các nan trong mẫu không thể cân đều. Bỏ chọn Nối bằng nan để dùng bố trí thường.');});
    return at;
  }
  // Photo sources describe BLACK material, unlike the legacy cutout catalog.
  // Every straight-side copy is a rigid similarity transform. Wide curved
  // drawings are clipped at mitres; they never enter strokeGrid/square cells.
  function buildMaterialRepeat(b,inner,data,U){
    var meta=data.material_repeat;
    if(!meta || meta.version!==1 || meta.polarity!=='material' || meta.axis!=='x' || meta.scale_axis!=='height' || meta.seam!=='periodic' || !Number.isFinite(data.width) || !Number.isFinite(data.height) || data.width<=0 || data.height<=0 || Math.abs(meta.period-data.width)>.001)
      throw Error('Dữ liệu chu kỳ của mẫu ảnh chạy viền không hợp lệ.');
    var height=Math.min(b.module,b.width-b.gap),scale=height/data.height,period=data.width*scale,
      extraGap=b.join_equal===true?0:b.gap,pitch=period+extraGap,source=U.template(data),sourcePoints=source.reduce(function(n,p){return n+p.length;},0),
      regions=U.parts(inner),band=[],material=[],cuts=[],cores=[],envelopes=[],placements=[],runs=[],mitres=[],work=0,vertices=0,logicalCount=0;
    if(!regions.length)throw Error('Không còn vùng trong để chạy viền.');
    if(!source.length || sourcePoints>20000)throw Error('Mẫu ảnh chạy viền thiếu nét hoặc quá nhiều điểm.');
    var sourceBounds=U.G.bounds(source.reduce(function(a,p){return a.concat(p);},[]));
    if(sourceBounds.x0<-.001 || sourceBounds.y0<-.001 || sourceBounds.x1>data.width+.001 || sourceBounds.y1>data.height+.001)throw Error('Biên mẫu ảnh vượt ô chu kỳ đã khai báo.');
    var sourcePaths=U.bool(U.toPaths(source),[],'union'),scaled=U.parts(sourcePaths).map(function(part){
      var loops=[part.outer].concat(part.holes),paths=loops.map(function(loop){return loop.map(function(p){return mul(p,scale);});});
      return {loops:paths,bounds:U.G.bounds(part.outer.map(function(p){return mul(p,scale);}))};
    });
    var projection=scaled.map(function(p){return [p.bounds.x0,p.bounds.x1];});
    function modulo(x){return (x%pitch+pitch)%pitch;}
    function phases(at){var out=[];projection.forEach(function(p){var lo=modulo(at-p[1]),hi=lo+p[1]-p[0];if(hi<=pitch)out.push([lo,hi]);else{out.push([lo,pitch]);out.push([0,hi-pitch]);}});return out;}
    function barePhase(start,end){
      var first=phases(start),last=phases(end),best=null;
      first.forEach(function(a){last.forEach(function(z){var lo=Math.max(a[0],z[0]),hi=Math.min(a[1],z[1]);if(hi-lo>1e-5 && (!best || hi-lo>best[1]-best[0]))best=[lo,hi];});});
      if(!best)throw Error('Hai đầu diềm rơi vào khoảng trắng của ảnh. Đổi nhẹ cỡ mẫu hoặc bật viền bao để giữ đủ khổ.');
      return (best[0]+best[1])/2;
    }
    regions.forEach(function(region,regionIndex){
      var p=U.G.validateLoop(region.outer,'Đường chạy mẫu ảnh');if(U.G.area(p)<0)p=p.slice().reverse();
      if(allOmitted(b)){cores.push({outer:p,holes:region.holes,depth:0,inside:U.toPaths([p])});return;}
      if(p.length>2048)throw Error('Biên chạy mẫu ảnh quá nhiều đoạn. Làm gọn biên trước khi chạy viền.');
      var checked=ring(p,height,U),n=p.length,dirs=p.map(function(a,i){var d=sub(p[(i+1)%n],a);return mul(d,1/length(d));}),q=p.map(function(a,i){
        var prev=dirs[(i+n-1)%n],d=dirs[i],den=cross(prev,d),normal=[-d[1],d[0]];
        if(Math.abs(den)<1e-8)return add(a,mul(normal,height));
        var x=add(a,mul([-prev[1],prev[0]],height)),y=add(a,mul(normal,height));return add(x,mul(prev,cross(sub(y,x),d)/den));
      }),sides=dirs.map(sideOf),f=b.edge_frame || {enabled:true,outer:10,inner:10},outer=f.enabled?f.outer:0,cap=f.enabled?Math.max(f.outer,f.inner):0,
        fullSpan=U.frameless && b.layout && b.layout.enabled && hasOmissions(b) && !region.holes.length && n===4 && dirs.every(function(d){return Math.abs(d[0])<1e-7 || Math.abs(d[1])<1e-7;}),
        sectorPaths=[],ends=[],segmentRows=[],perimeter=0;
      p.forEach(function(a,i){if(!b['omit_'+sides[i]] && !b['omit_'+sides[(i+n-1)%n]])mitres.push({a:a,c:q[i]});});
      logicalCount+=Math.ceil(p.reduce(function(sum,a,i){return sum+(b['omit_'+sides[i]]?0:length(sub(p[(i+1)%n],a)));},0)/pitch);
      if(logicalCount>500)throw Error('Viền quá nhiều chu kỳ. Tăng cỡ mẫu viền.');
      p.forEach(function(a,i){
        var j=(i+1)%n,d=dirs[i],normal=[-d[1],d[0]],len=length(sub(p[j],a)),previous=(i+n-1)%n;
        var startOpen=b['omit_'+sides[previous]]===true,endOpen=b['omit_'+sides[j]]===true;
        if(b['omit_'+sides[i]]){perimeter+=len;return;}
        var A=a,B=p[j],C=q[i],D=q[j];
        // At an open rectangular end reserve only the real cap, not a whole
        // corner cell. The later stroke/rim offsets cancel the own-layout offset.
        if(startOpen){var start=fullSpan?cap-outer:Math.max(0,dot(sub(C,A),d));A=add(a,mul(d,start));C=add(A,mul(normal,height));}
        if(endOpen){var finish=fullSpan?len-cap+outer:Math.min(len,dot(sub(D,a),d));B=add(a,mul(d,finish));D=add(B,mul(normal,height));}
        if(dot(sub(B,A),d)<=.001)throw Error('Cạnh quá ngắn cho diềm và đầu bọc. Giảm cỡ mẫu hoặc bề rộng viền.');
        var sector=[A,B,D,C],local=sector.map(function(pt){var t=sub(pt,a);return [dot(t,d),dot(t,normal)];}),localBox=U.G.bounds(local),phase=modulo(-perimeter);
        if(fullSpan && !cap && (startOpen || endOpen))phase=barePhase(localBox.x0,localBox.x1);
        var first=Math.floor((localBox.x0-phase-period)/pitch)+1,last=Math.ceil((localBox.x1-phase)/pitch)-1,localCopies=[];
        for(var tile=first;tile<=last;tile++){
          var offset=phase+tile*pitch;
          scaled.forEach(function(part){
            if(part.bounds.x1+offset<localBox.x0 || part.bounds.x0+offset>localBox.x1)return;
            work+=part.loops.reduce(function(c,l){return c+l.length;},0);
            if(work>2000000)throw Error('Viền ảnh quá nặng. Tăng cỡ mẫu hoặc làm gọn đường chạy.');
            part.loops.forEach(function(loop){localCopies.push(loop.map(function(pt){return [pt[0]+offset,pt[1]];}));});
          });
        }
        var localBand=U.toPaths([local]),clipped=U.bool(U.toPaths(localCopies),localBand,'intersection'),localCuts=U.bool(localBand,clipped,'difference');
        function mappedPaths(paths){return U.parts(paths).reduce(function(out,part){return out.concat([part.outer].concat(part.holes).map(function(loop){return loop.map(function(pt){return add(add(a,mul(d,pt[0])),mul(normal,pt[1]));});}));},[]);}
        var mappedParts=mappedPaths(clipped);cuts=cuts.concat(U.toPaths(mappedPaths(localCuts)));
        vertices+=mappedParts.reduce(function(sum,l){return sum+l.length;},0);
        if(vertices>120000)throw Error('Viền ảnh quá nhiều điểm. Tăng cỡ mẫu hoặc giảm độ phức tạp đường chạy.');
        material=material.concat(U.toPaths(mappedParts));sectorPaths=sectorPaths.concat(U.toPaths([sector]));
        if(startOpen)ends.push({a:A,c:C,tangent:mul(d,-1)});if(endOpen)ends.push({a:B,c:D,tangent:d});
        var row={region:regionIndex,run:i,side:sides[i],length:len,pitch:pitch,gap:extraGap,requested_gap:b.gap,count:Math.max(0,last-first+1),width:period,height:height,uniform_size:true,join_equal:b.join_equal===true,material_repeat:true,phase:phase,angle:Math.atan2(d[1],d[0])*180/Math.PI};
        runs.push(row);placements.push(row);segmentRows.push(row);perimeter+=len;
      });
      var kept=U.bool(sectorPaths,[],'union'),inside=checked.inside;
      var envelope={outer:U.toPaths([p]),inner:inside,kept:kept,ends:ends};
      if(fullSpan)envelope.inner=U.bool(envelope.outer,kept,'difference');
      if(fullSpan && cap){
        var extensions=ends.map(function(end){var normal=mul(sub(end.c,end.a),1/height),pad=Math.max(cap,Math.abs(b.stroke_adjust||0),1)+2,
          a=add(end.c,mul(end.tangent,-pad)),z=add(end.c,mul(end.tangent,pad)),loop=[a,z,add(z,mul(normal,pad)),add(a,mul(normal,pad))];return U.G.area(loop)<0?loop.reverse():loop;});
        envelope.inner=U.bool(envelope.inner,U.toPaths(extensions),'union');
      }
      envelopes.push(envelope);band=band.concat(kept);cores.push({outer:p,holes:region.holes,depth:height,inside:hasOmissions(b)?U.bool(U.toPaths([p]),kept,'difference'):inside});
    });
    band=U.bool(U.bool(band,[],'union'),inner,'intersection');material=U.bool(U.bool(material,[],'union'),band,'intersection');
    cuts=U.bool(cuts,[],'union');
    if(!material.length && !allOmitted(b))throw Error('Mẫu ảnh không còn vật liệu trên đường chạy. Tăng cỡ mẫu hoặc đổi khoảng ngắt.');
    return {band:band,cuts:cuts,material:material,count:logicalCount,runs:runs,placements:placements,cores:cores,envelopes:envelopes,material_repeat:true,source_polarity:'material',repeat_aspect:data.width/data.height,mitres:mitres};
  }
  // The reviewed terminal phases cut only natural connecting necks or white
  // space. A repeat seam is not necessarily a complete ornamental symbol.
  var photoTerminal=[1.18,536.0089,118.23,210,38.511,112.021858];
  function buildWholePhoto(b,inner,data,U){
    var meta=data.material_repeat;
    if(!meta || meta.version!==1 || meta.polarity!=='material' || meta.axis!=='x' || meta.scale_axis!=='height' || meta.seam!=='periodic' || !Number.isFinite(data.width) || !Number.isFinite(data.height) || data.width<=0 || data.height<=0 || Math.abs(meta.period-data.width)>.001)
      throw Error('Dữ liệu chu kỳ của mẫu ảnh chạy viền không hợp lệ.');
    var source=U.template(data),points=source.reduce(function(n,l){return n+l.length;},0),regions=U.parts(inner);
    if(!source.length || points>20000)throw Error('Mẫu ảnh chạy viền thiếu nét hoặc quá nhiều điểm.');
    if(!regions.length)throw Error('Không còn vùng trong để chạy viền.');
    var box=U.G.bounds(source.reduce(function(a,l){return a.concat(l);},[]));
    if(box.x0<-.001 || box.y0<-.001 || box.x1>data.width+.001 || box.y1>data.height+.001)throw Error('Biên mẫu ảnh vượt ô chu kỳ đã khai báo.');
    var phase=photoTerminal[photoIds.indexOf(b.id)],periodSource=data.width,ratio=data.width/data.height,
      requested=Math.min(b.module,b.width-b.gap),gap=b.join_equal===true?0:b.gap,
      f=b.edge_frame || {enabled:true,outer:10,inner:10},wrapped=U.frameless && f.enabled,
      cap=wrapped?Math.max(f.outer,f.inner):0,outerRim=wrapped?f.outer:0,
      band=[],material=[],runs=[],placements=[],cores=[],envelopes=[],fitRows=[],total=0,work=0;
    function rect(x,y,w,h){return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}
    var cyclic=[];
    [-phase,periodSource-phase].forEach(function(dx){source.forEach(function(loop){cyclic.push(loop.map(function(p){return [p[0]+dx,p[1]];}));});});
    var unitPaths=U.bool(U.toPaths(cyclic),U.toPaths([rect(0,0,periodSource,data.height)]),'intersection');
    var unit=U.parts(unitPaths).reduce(function(out,p){return out.concat([p.outer].concat(p.holes));},[]);
    regions.forEach(function(region,regionIndex){
      var p=U.G.validateLoop(region.outer,'Đường chạy mẫu ảnh'),bounds=U.G.bounds(p),W=bounds.x1-bounds.x0,H=bounds.y1-bounds.y0;
      var rectangle=p.length===4 && !region.holes.length && p.every(function(a,i){var z=p[(i+1)%p.length];return Math.abs(a[0]-z[0])<.0001 || Math.abs(a[1]-z[1])<.0001;});
      if(!rectangle)throw Error('Giữ trọn mẫu chỉ áp dụng cho khung chữ nhật. Bỏ chọn Giữ trọn mẫu, cân đều hai cạnh để chạy theo biên cong hoặc xiên.');
      p=rect(bounds.x0,bounds.y0,W,H);
      if(allOmitted(b)){cores.push({outer:p,holes:[],depth:0,inside:U.toPaths([p])});return;}
      var active={bottom:!b.omit_bottom,top:!b.omit_top,left:!b.omit_left,right:!b.omit_right},
        fullSpan=U.frameless && b.layout && b.layout.enabled && hasOmissions(b),
        specs=[{axis:'x',len:W,used:active.top||active.bottom,start:active.left,end:active.right,mult:(active.top?1:0)+(active.bottom?1:0)},
               {axis:'y',len:H,used:active.left||active.right,start:active.bottom,end:active.top,mult:(active.left?1:0)+(active.right?1:0)}].filter(function(s){return s.used;});
      specs.forEach(function(s){s.a=(s.start||!fullSpan?1:0)+(s.end||!fullSpan?1:0);s.b=fullSpan?((s.start?0:1)+(s.end?0:1))*(cap-outerRim):0;});
      var maxHeight=Math.min(requested,Math.min(W,H)/2-.001),best=null;
      if(!(maxHeight>0))throw Error('Khổ diềm quá nhỏ để bố trí mẫu.');
      function consider(h){
        if(!(h>0) || h>maxHeight+.000001)return;
        var counts={},slacks={},count=0,score=.3*Math.pow(1-h/requested,2),valid=true;
        specs.forEach(function(s){var room=s.len-s.a*h-s.b,n=Math.floor((room+gap+.000001)/(ratio*h+gap));
          if(n<1){valid=false;return;}var slack=Math.max(0,room-n*ratio*h-(n-1)*gap);counts[s.axis]=n;slacks[s.axis]=slack;count+=n*s.mult;score+=Math.pow(slack/s.len,2);
        });
        if(valid && count<=500 && (!best || score<best.score-1e-12 || Math.abs(score-best.score)<1e-12 && h>best.height))best={height:h,counts:counts,slacks:slacks,count:count,score:score};
      }
      // Only similarity scales are candidates. Residual space is centred at
      // the two ends; neither a curve nor a symbol is stretched into a corner.
      consider(maxHeight);
      specs.forEach(function(s){for(var n=1;n<=500;n++)consider((s.len-s.b-(n-1)*gap)/(n*ratio+s.a));});
      if(!best)throw Error('Viền quá nhiều chu kỳ hoặc không đủ chỗ. Tăng cỡ mẫu hoặc giảm khoảng ngắt.');
      total+=best.count;if(total>500)throw Error('Viền quá nhiều chu kỳ. Tăng cỡ mẫu viền.');
      var h=best.height,scale=h/data.height,period=periodSource*scale,pitch=period+gap,
        checked=ring(p,h,U),q=rect(bounds.x0+h,bounds.y0+h,W-2*h,H-2*h),
        sides=['bottom','right','top','left'],dirs=[[1,0],[0,1],[-1,0],[0,-1]],keptPaths=[],ends=[],photoMaterial=[],photoWindows=[];
      p.forEach(function(a,i){var j=(i+1)%4,d=dirs[i],normal=[-d[1],d[0]],side=sides[i];if(!active[side])return;
        var len=i%2?H:W,A=a,B=p[j],C=q[i],D=q[j],startOpen=!active[sides[(i+3)%4]],endOpen=!active[sides[j]];
        if(startOpen){A=add(a,mul(d,fullSpan?cap-outerRim:h));C=add(A,mul(normal,h));}
        if(endOpen){B=add(a,mul(d,fullSpan?len-cap+outerRim:len-h));D=add(B,mul(normal,h));}
        keptPaths=keptPaths.concat(U.toPaths([[A,B,D,C]]));
        if(startOpen)ends.push({a:A,c:C,tangent:mul(d,-1)});if(endOpen)ends.push({a:B,c:D,tangent:d});
      });
      var kept=U.bool(keptPaths,[],'union'),inside=checked.inside,envelope={outer:U.toPaths([p]),inner:inside,kept:kept,ends:ends};
      if(fullSpan)envelope.inner=U.bool(envelope.outer,kept,'difference');
      if(fullSpan && cap){
        var extensions=ends.map(function(end){var normal=mul(sub(end.c,end.a),1/h),pad=Math.max(cap,Math.abs(b.stroke_adjust||0),1)+2,
          a=add(end.c,mul(end.tangent,-pad)),z=add(end.c,mul(end.tangent,pad)),loop=[a,z,add(z,mul(normal,pad)),add(a,mul(normal,pad))];return U.G.area(loop)<0?loop.reverse():loop;});
        envelope.inner=U.bool(envelope.inner,U.toPaths(extensions),'union');
      }
      function marginFor(axis,end){var s=specs.filter(function(s){return s.axis===axis;})[0];return ((end?s.end:s.start)||!fullSpan?h:cap-outerRim)+best.slacks[axis]/2;}
      var x=bounds.x0,y=bounds.y0,rows=[
        {side:'bottom',axis:'x',origin:[x,y],u:[1,0],v:[0,1]},
        {side:'top',axis:'x',origin:[x,y+H-h],u:[1,0],v:[0,1]},
        {side:'left',axis:'y',origin:[x+h,y],u:[0,1],v:[-1,0]},
        {side:'right',axis:'y',origin:[x+W,y],u:[0,1],v:[-1,0]}];
      rows.forEach(function(row){if(!active[row.side])return;
        var count=best.counts[row.axis],start=marginFor(row.axis,false),rowInfo={region:regionIndex,side:row.side,count:count,width:period,height:h,requested_height:b.module,maximum_height:requested,pitch:pitch,gap:gap,phase:phase*scale,start_offset:start,end_offset:marginFor(row.axis,true),uniform_size:true,join_equal:b.join_equal===true,material_repeat:true,whole_motifs:true,angle:row.axis==='x'?0:90};
        runs.push(rowInfo);
        for(var i=0;i<count;i++){
          var along=start+i*pitch,loops=unit.map(function(loop){return loop.map(function(pt){return add(add(row.origin,mul(row.u,along+pt[0]*scale)),mul(row.v,pt[1]*scale));});});
          work+=points;if(work>120000)throw Error('Viền ảnh quá nhiều điểm. Tăng cỡ mẫu hoặc giảm độ phức tạp.');
          // No sector intersection is allowed here: each complete period is
          // already wholly inside its straight rectangle by construction.
          photoMaterial=photoMaterial.concat(U.toPaths(loops));
          photoWindows=photoWindows.concat(U.toPaths([rect(0,0,period,h).map(function(pt){return add(add(row.origin,mul(row.u,along+pt[0])),mul(row.v,pt[1]));})]));
          placements.push(Object.assign({},rowInfo,{index:i,origin:add(row.origin,mul(row.u,along)),scale:scale,source_phase:phase}));
        }
      });
      photoMaterial=U.bool(photoMaterial,[],'union');
      material=material.concat(photoMaterial);
      // Three integer geometry units remove near-collinear kissing vertices
      // where a plain joint meets a traced terminal (0.0003 mm only).
      var protectedVoids=U.offset(U.bool(U.bool(photoWindows,[],'union'),photoMaterial,'difference'),-.0003);
      if(!U.frameless || wrapped){
        // Plain structural corner joins connect the two physical rims. They
        // are separate from the photo art, never a clipped decorative fragment.
        p.forEach(function(a,i){if(!active[sides[i]] || !active[sides[(i+3)%4]])return;
          var z=q[i],v=sub(z,a),len=length(v),t=mul(v,1/len),normal=[-t[1],t[0]],thick=Math.min(h/3,wrapped?Math.max(f.outer,f.inner):10);
          if(!(thick>0))return;
          var A=add(a,mul(t,-.0002)),Z=add(z,mul(t,.0002)),loop=[add(A,mul(normal,thick/2)),add(Z,mul(normal,thick/2)),add(Z,mul(normal,-thick/2)),add(A,mul(normal,-thick/2))];
          if(U.G.area(loop)<0)loop.reverse();
          var joint=U.bool(U.toPaths([loop]),kept,'intersection');
          // Keep even the terminal white spaces of each complete photo unit.
          joint=U.bool(joint,protectedVoids,'difference');material=material.concat(joint);
        });
      }
      band=band.concat(kept);envelopes.push(envelope);cores.push({outer:p,holes:[],depth:h,inside:hasOmissions(b)?U.bool(U.toPaths([p]),kept,'difference'):inside});
      fitRows.push({region:regionIndex,requested_height:b.module,maximum_height:requested,actual_height:h,scale:scale,horizontal_count:best.counts.x||0,vertical_count:best.counts.y||0,horizontal_end_margin:best.slacks.x/2||0,vertical_end_margin:best.slacks.y/2||0});
    });
    band=U.bool(band,[],'union');material=U.bool(material,[],'union');
    if(Math.abs(U.area(U.bool(material,band,'difference')))>.01)throw Error('Mẫu nguyên vượt vùng bố trí. Giảm cỡ mẫu hoặc kiểm tra đường bao.');
    return {band:band,cuts:U.bool(band,material,'difference'),material:material,count:total,runs:runs,placements:placements,cores:cores,envelopes:envelopes,material_repeat:true,whole_motifs:true,fit_info:fitRows,source_polarity:'material',repeat_aspect:ratio,mitres:[]};
  }

  function isPaired(id){return id===pairedId;}

  function pairedDefaults(id, width, height){
    if(!isPaired(id))return null;
    return {width:Math.min(34,Math.min(width,height)*.12),module:108,gap:0,join_equal:true};
  }

  function buildPairedBorder(b,inner,data,U){
    var pair=data.border_pair;
    if(!pair || !pair.corner || !pair.straight)throw Error('Thiếu dữ liệu góc 90° hoặc đoạn thẳng của Biên Góc 10.');
    var cornerSource=pair.corner,straightSource=pair.straight;
    var scale=Math.min(b.width/straightSource.height,b.module/straightSource.width);
    var motifWidth=straightSource.width*scale,motifHeight=straightSource.height*scale,leg=cornerSource.width*scale;
    var regions=U.parts(inner),band=[],cuts=[],placements=[],runs=[],cores=[],envelopes=[];
    if(!regions.length)throw Error('Không còn vùng trong để chạy viền.');

    function addCuts(source,origin,direction,normal){
      var loops=source.holes.map(function(loop){
        var mapped=loop.map(function(p){return add(origin,add(mul(direction,p[0]*scale),mul(normal,p[1]*scale)));});
        return U.G.area(mapped)>0 ? mapped : mapped.reverse();
      });
      cuts=cuts.concat(U.toPaths(loops));
    }

    regions.forEach(function(region,regionIndex){
      var outer=U.G.validateLoop(region.outer,'Biên Góc 10');
      var outerPaths=U.toPaths([outer]);
      if(allOmitted(b)){
        cores.push({outer:outer,holes:region.holes,depth:0,inside:outerPaths});
        return;
      }
      // Collinear vertices from drawn or imported rectangles do not create a turn.
      outer=outer.filter(function(p,i){
        var before=sub(p,outer[(i+outer.length-1)%outer.length]),after=sub(outer[(i+1)%outer.length],p);
        return Math.abs(cross(before,after))>1e-7*length(before)*length(after);
      });
      var r=ring(outer,b.width,U);
      if(outer.length!==4 || r.corners.length!==4 || r.corners.some(function(c){return c.concave;})){
        throw Error('Biên Góc 10 dùng khung chữ nhật có bốn góc 90°. Chọn lại biên khung.');
      }
      var keptBand=activeBand(r,b,U),ends=[];
      band=band.concat(keptBand);
      cores.push({outer:outer,holes:region.holes,depth:motifHeight,
        inside:hasOmissions(b)?U.bool(outerPaths,keptBand,'difference'):r.inside});
      envelopes.push({outer:outerPaths,inner:r.inside,kept:keptBand,ends:ends});
      var cornerAt=function(vertex){return r.corners.find(function(c){return c.vertex===vertex;});};
      var enabled=function(corner){return corner.sides.every(function(side){return !b['omit_'+side];});};

      r.corners.filter(enabled).forEach(function(corner){
        addCuts(cornerSource,corner.origin,corner.direction,corner.normal);
        placements.push({region:regionIndex,run:-1,kind:'corner',vertex:corner.vertex,uniform_size:true,
          width:leg,height:leg,angle:Math.atan2(corner.direction[1],corner.direction[0])*180/Math.PI,
          center:add(corner.origin,add(mul(corner.direction,leg/2),mul(corner.normal,leg/2)))});
      });

      activeRuns(r,b).forEach(function(run,runIndex){
        var segment=run.segments[0],direction=run.straight.direction,normal=[-direction[1],direction[0]];
        var leftCorner=enabled(cornerAt(run.startVertex)),rightCorner=enabled(cornerAt(run.endVertex));
        var left=leftCorner?Math.max(0,leg-b.width):0,right=rightCorner?Math.max(0,leg-b.width):0;
        var available=run.length-left-right;
        if(available<-.0001)throw Error('Hai mẫu góc Biên Góc 10 bị chồng. Giảm cỡ mẫu viền hoặc tăng kích thước khung.');
        if(!leftCorner)ends.push({a:segment.a,c:segment.c,tangent:mul(direction,-1)});
        if(!rightCorner)ends.push({a:segment.b,c:segment.d,tangent:direction});

        var count=Math.max(0,Math.floor((available+b.gap+.00000001)/(motifWidth+b.gap)));
        if(count+placements.length>500)throw Error('Viền quá nhiều mẫu. Tăng cỡ mẫu viền.');
        var spare=available-count*motifWidth;
        var gap=b.join_equal && count ? spare/(count+1) : b.gap;
        if(count>1 && gap<b.gap){gap=b.gap;}
        var margin=count ? Math.max(0,(spare-(count-1)*gap)/2) : Math.max(0,spare/2);
        var pitch=motifWidth+gap;
        runs.push({region:regionIndex,run:runIndex,length:run.length,count:count,pitch:pitch,gap:gap,
          requested_gap:b.gap,start_offset:left+margin,end_offset:right+margin,uniform_size:true,
          join_equal:b.join_equal===true,width:motifWidth,height:motifHeight});
        for(var i=0;i<count;i++){
          var start=left+margin+i*pitch,origin=add(segment.a,mul(direction,start));
          addCuts(straightSource,origin,direction,normal);
          placements.push({region:regionIndex,run:runIndex,index:i,kind:'straight',start:start,span:motifWidth,uniform_size:true,
            width:motifWidth,height:motifHeight,angle:Math.atan2(direction[1],direction[0])*180/Math.PI,
            center:add(origin,add(mul(direction,motifWidth/2),mul(normal,motifHeight/2)))});
        }
      });
    });
    band=U.bool(U.bool(band,[],'union'),inner,'intersection');
    cuts=U.bool(cuts,[],'union');
    if(!cuts.length && !hasOmissions(b))throw Error('Khung quá nhỏ để đặt Biên Góc 10.');
    if(Math.abs(U.area(U.bool(cuts,band,'difference')))>.0001 || U.parts(cuts).length!==2*placements.length){
      throw Error('Lỗ Biên Góc 10 chạm khung, lỗ có sẵn hoặc chồng nhau. Kiểm tra mép khung và cỡ mẫu viền.');
    }
    return {band:band,cuts:cuts,count:placements.length,runs:runs,placements:placements,cores:cores,envelopes:envelopes};
  }

  function build(input,inner,data,U){
    var b=normalize(input);
    if(!data)throw Error('Chưa nạp mẫu chạy viền.');
    if(b.id===pairedId)return buildPairedBorder(b,inner,data,U);
    if(photoIds.indexOf(b.id)>=0)return b.photo_fit ? buildWholePhoto(b,inner,data,U) : buildMaterialRepeat(b,inner,data,U);
    var regions=U.parts(inner),band=[],cuts=[],placements=[],runInfo=[],cores=[],envelopes=[],actualBand=[],vertices=0,untrimmedEnds=false;
    if(!regions.length)throw Error('Không còn vùng trong để chạy viền.');
    var source=U.template(data);
    regions.forEach(function(region,regionIndex){
      if(allOmitted(b)){
        cores.push({outer:region.outer,holes:region.holes,depth:0,inside:U.toPaths([region.outer])});return;
      }
      var r=ring(region.outer,b.width,U),keptBand=activeBand(r,b,U);band=band.concat(keptBand);
      var ends=[];
      r.segments.forEach(function(segment,i){
        if(b['omit_'+segment.side])return;
        var tangent=sub(lerp(segment.b,segment.d,.5),lerp(segment.a,segment.c,.5));tangent=mul(tangent,1/length(tangent));
        if(b['omit_'+r.segments[(i+r.segments.length-1)%r.segments.length].side])ends.push({a:segment.a,c:segment.c,tangent:mul(tangent,-1)});
        if(b['omit_'+r.segments[(i+1)%r.segments.length].side])ends.push({a:segment.b,c:segment.d,tangent:tangent});
      });
      var envelope={outer:U.toPaths([region.outer]),inner:r.inside,kept:keptBand,ends:ends},fullSupport=[],keptSupport=[],actualEnds=[];
      envelopes.push(envelope);
      // On orthogonal frames every repeat, including corners, is the same
      // uniformly scaled source. Only spacing may change to fit an edge.
      var uniform=r.corners.length===r.runs.length && r.runs.every(function(run){return run.straight && Math.abs(run.straight.left)<1e-6 && Math.abs(run.straight.right)<1e-6;});
      // A separately sized rectangular strip owns its complete outside span.
      // Removing a neighbouring side releases its corner reservation. Rebuild
      // the repeats up to the end-cap plane instead of stretching the result.
      var fullSpan=U.frameless && b.layout && b.layout.enabled && hasOmissions(b) && !region.holes.length && uniform && r.segments.length===4 &&
        r.segments.every(function(s){var d=sub(s.b,s.a);return Math.abs(d[0])<1e-7 || Math.abs(d[1])<1e-7;}),
        spanFrame=b.edge_frame || {enabled:true,outer:10,inner:10},spanOuter=spanFrame.enabled?spanFrame.outer:0,
        spanCap=spanFrame.enabled?Math.max(spanFrame.outer,spanFrame.inner):0,spanWrapped=spanFrame.enabled && spanCap>0;
      var bareBounds=null;
      if(fullSpan && !spanWrapped){
        // Some source cutouts cover the complete first/last few millimetres
        // of their cell. The standalone size must measure retained material,
        // not that invisible terminal void (notably source duc_010).
        var material=U.bool(U.toPaths([[[0,0],[data.width,0],[data.width,data.height],[0,data.height]]]),U.toPaths(source),'difference');
        bareBounds=U.G.bounds(U.parts(material).reduce(function(points,p){return points.concat(p.outer);},[]));
        untrimmedEnds=true;
      }
      var factor=Math.min(b.module,b.width-b.gap)/Math.max(data.width,data.height);
      var motifWidth=uniform ? data.width*factor : b.width-b.gap,motifHeight=uniform ? data.height*factor : b.width-b.gap;
      cores.push({outer:region.outer,holes:region.holes,depth:uniform ? Math.max(motifWidth,motifHeight) : b.width-b.gap,inside:hasOmissions(b) ? U.bool(U.toPaths([region.outer]),keptBand,'difference') : r.inside});
      var matched=uniform && b.join_equal===true,gridX,gridY,stroke=null,cornerX,cornerY;
      if(matched){
        gridX=strokeGrid(source,0);gridY=strokeGrid(source,1);
        stroke=Math.min(gridX.nominal,gridY.nominal)*factor;
        cornerX=strokeMap(gridX,motifWidth,stroke);cornerY=strokeMap(gridY,motifHeight,stroke);
      }
      r.corners.forEach(function(corner){
        // At a convex corner the two frame edges meet at (0,0); at a concave
        // corner they meet at (width,0). Neither may gain half a padding gap.
        var xOffset=corner.concave ? b.width-motifWidth : 0;
        corner.motifOrigin=add(corner.origin,mul(corner.direction,xOffset));
        corner.motifBox=[corner.motifOrigin,add(corner.motifOrigin,mul(corner.direction,motifWidth)),
          add(add(corner.motifOrigin,mul(corner.direction,motifWidth)),mul(corner.normal,motifHeight)),add(corner.motifOrigin,mul(corner.normal,motifHeight))];
        fullSupport.push(corner.motifBox);
        if(corner.sides.some(function(s){return b['omit_'+s];}))return;
        keptSupport.push(corner.motifBox);
        var loops=source.map(function(loop){return loop.map(function(p){
          return add(add(corner.motifOrigin,mul(corner.direction,matched ? cornerX(p[0]) : p[0]/data.width*motifWidth)),mul(corner.normal,matched ? cornerY(p[1]) : p[1]/data.height*motifHeight));
        });});
        vertices+=loops.reduce(function(n,l){return n+l.length;},0);
        cuts=cuts.concat(U.toPaths(loops));
        placements.push({region:regionIndex,run:-1,kind:'corner',vertex:corner.vertex,uniform_size:uniform&&!matched,join_equal:matched,stroke:stroke,width:motifWidth,height:motifHeight,angle:Math.atan2(corner.direction[1],corner.direction[0])*180/Math.PI,
          center:add(add(corner.motifOrigin,mul(corner.direction,motifWidth/2)),mul(corner.normal,motifHeight/2))});
      });
      function supportLoop(run,start,finish){
        return mapLoop([[0,0],[1,0],[1,1],[0,1]],{width:1,height:1},run,start,finish-start,b.width,b.width-motifHeight);
      }
      function cornerLimits(run){
        if(!uniform)return {left:0,right:run.length,start:null,end:null};
        var start=r.corners.find(function(c){return c.vertex===run.startVertex;}),end=r.corners.find(function(c){return c.vertex===run.endVertex;});
        var along=function(p){return dot(sub(p,run.segments[0].a),run.straight.direction);};
        return {left:Math.max.apply(null,start.motifBox.map(along)),right:Math.min.apply(null,end.motifBox.map(along)),start:start,end:end};
      }
      r.runs.forEach(function(run){var limits=cornerLimits(run);fullSupport.push(supportLoop(run,limits.left,limits.right));});
      activeRuns(r,b).forEach(function(run,runIndex){
        var startOpen=!run.closed && b['omit_'+r.segments[(run.startVertex+r.segments.length-1)%r.segments.length].side]===true,
          endOpen=!run.closed && b['omit_'+r.segments[run.endVertex%r.segments.length].side]===true,
          extendSpan=fullSpan && (startOpen || endOpen);
        var count=Math.max(1,Math.round(run.length/(b.module+b.gap))),pitch=run.length/count,span=pitch-b.gap;
        var gap=b.gap,startOffset=b.gap/2,endOffset=b.gap/2,radialGap=b.gap;
        if(uniform){
          // Project the actual anchored corner footprints. This also handles
          // concave turns and non-square sources without shifting the frame.
          var startCorner=r.corners.find(function(c){return c.vertex===run.startVertex;}),endCorner=r.corners.find(function(c){return c.vertex===run.endVertex;});
          var along=function(p){return dot(sub(p,run.segments[0].a),run.straight.direction);};
          var leftCut=Math.max.apply(null,startCorner.motifBox.map(along)),rightCut=Math.min.apply(null,endCorner.motifBox.map(along)),available=rightCut-leftCut;
          if(extendSpan){
            // adjustFootprint later moves the end inward by stroke_adjust/2;
            // own-layout moves the guide outward by that same amount. They
            // cancel here, so the final cap remains exactly at the input box.
            if(startOpen)leftCut=along(region.outer[run.startVertex])+spanCap-spanOuter;
            if(endOpen)rightCut=along(region.outer[run.endVertex])-spanCap+spanOuter;
            available=rightCut-leftCut;
          }
          var supportLeft=leftCut,supportRight=rightCut,extendBare=extendSpan && bareBounds;
          var terminalLimits=function(size){
            if(!extendBare)return;
            var map=matched?strokeMap(gridX,size,stroke):function(x){return x/data.width*size;},delta=(b.stroke_adjust||0)/2;
            leftCut=supportLeft+(startOpen?2*delta-map(bareBounds.x0):0);
            rightCut=supportRight+(endOpen?size-map(bareBounds.x1)-2*delta:0);
            available=rightCut-leftCut;
          };
          terminalLimits(motifWidth);
          var minimumGap=b.gap+Math.max(0,(motifHeight-motifWidth)/2);
          var endGaps=extendSpan?(startOpen?0:1)+(endOpen?0:1):2;
          count=Math.max(0,Math.floor((available-(endGaps-1)*minimumGap+1e-8)/(motifWidth+minimumGap)));
          if(extendSpan && (count<1 || count-1+endGaps===0))throw Error('Cạnh diềm quá ngắn để bố trí mẫu nguyên đủ khổ. Tăng kích thước hoặc giảm cỡ mẫu viền.');
          gap=(available-count*motifWidth)/(count-1+endGaps);
          span=motifWidth;pitch=span+gap;
          startOffset=leftCut+(extendSpan&&startOpen?0:gap);
          endOffset=run.length-rightCut+(extendSpan&&endOpen?0:gap);
          radialGap=b.width-motifHeight;
        }
        if(matched){
          gap=stroke;
          count=Math.max(1,Math.round((available-(endGaps-1)*gap)/(motifWidth+gap)));
          span=(available-(count-1+endGaps)*gap)/count;pitch=span+gap;
          if(extendBare){
            // strokeMap is affine in the available width while its solid
            // strokes stay fixed. Solve for the exact end-to-end material
            // span, including the cut offset applied after this build.
            terminalLimits(motifWidth);var f0=count*motifWidth+(count-1+endGaps)*gap-available;
            terminalLimits(motifWidth+1);var slope=count*(motifWidth+1)+(count-1+endGaps)*gap-available-f0;
            span=motifWidth-f0/slope;terminalLimits(span);pitch=span+gap;
          }
          startOffset=leftCut+(extendSpan&&startOpen?0:gap);
          endOffset=run.length-rightCut+(extendSpan&&endOpen?0:gap);
        }
        if(span<=0)throw Error('Một cạnh quá ngắn để bố trí mẫu viền. Giảm khe hoặc bề rộng dải.');
        if(placements.length+count>500)throw Error('Viền quá nhiều mẫu. Tăng cỡ mẫu viền.');
        runInfo.push({region:regionIndex,run:runIndex,start_vertex:run.startVertex,end_vertex:run.endVertex,length:run.length,count:count,pitch:pitch,gap:gap,requested_gap:b.gap,start_offset:startOffset,end_offset:endOffset,uniform_size:uniform&&!matched,join_equal:matched,stroke:stroke,width:span,height:uniform ? motifHeight : b.width-b.gap});
        var limits=cornerLimits(run);
        var supportStart=startOpen ? (extendBare?supportLeft:extendSpan?startOffset:Math.max(0,startOffset)) : limits.left,
          supportEnd=endOpen ? (extendBare?supportRight:extendSpan?startOffset+(count-1)*pitch+span:Math.min(run.length,startOffset+(count-1)*pitch+span)) : limits.right;
        if(supportEnd>supportStart && (!startOpen || count)){
          keptSupport.push(supportLoop(run,supportStart,supportEnd));
          [{open:startOpen,s:supportStart,sign:-1},{open:endOpen,s:supportEnd,sign:1}].forEach(function(end){
            if(!end.open)return;
            var a=mapped(run,end.s,0),c=mapped(run,end.s,motifHeight/b.width),near=end.s-end.sign*Math.min(.01,run.length/100),center=lerp(a,c,.5),other=lerp(mapped(run,near,0),mapped(run,near,motifHeight/b.width),.5),tangent=sub(center,other),norm=length(tangent);
            if(norm>1e-9)actualEnds.push({a:a,c:c,tangent:mul(tangent,1/norm)});
          });
        }
        var sideX=matched ? strokeMap(gridX,span,stroke) : null;
        for(var i=0;i<count;i++){
          var start=i*pitch+startOffset,loops=source.map(function(loop){
            if(matched)return loop.map(function(p){return mapped(run,start+sideX(p[0]),cornerY(p[1])/b.width);});
            return mapLoop(loop,data,run,start,span,b.width,radialGap);
          });
          vertices+=loops.reduce(function(n,l){return n+l.length;},0);
          if(vertices>120000)throw Error('Viền quá nhiều điểm. Tăng cỡ mẫu hoặc giảm độ phức tạp biên dạng.');
          cuts=cuts.concat(U.toPaths(loops));
          placements.push({region:regionIndex,run:runIndex,index:i,start:start,span:span,uniform_size:uniform&&!matched,join_equal:matched,stroke:stroke,width:span,height:b.width-radialGap,angle:run.straight ? Math.atan2(run.straight.direction[1],run.straight.direction[0])*180/Math.PI : null,center:mapped(run,start+span/2,(b.width-radialGap)/(2*b.width))});
        }
      });
      if(U.frameless){
        var full=U.bool(U.toPaths(fullSupport),[],'union'),kept=U.bool(U.toPaths(keptSupport),[],'union');
        envelope.inner=U.bool(envelope.outer,fullSpan?kept:full,'difference');
        if(fullSpan && spanWrapped){
          // The inner-side guide must continue past an exposed end. If it
          // terminates at the rectangle, a negative stroke offset shrinks it
          // longitudinally too and breaks the inner rim beside the end cap.
          var extensions=actualEnds.map(function(end){
            var radial=sub(end.c,end.a);radial=mul(radial,1/length(radial));
            var pad=Math.max(spanCap,Math.abs(b.stroke_adjust||0),1)+2,a=add(end.c,mul(end.tangent,-pad)),z=add(end.c,mul(end.tangent,pad));
            var loop=[a,z,add(z,mul(radial,pad)),add(a,mul(radial,pad))];
            return U.G.area(loop)<0?loop.reverse():loop;
          });
          envelope.inner=U.bool(envelope.inner,U.toPaths(extensions),'union');
        }
        envelope.kept=kept;envelope.ends=actualEnds;actualBand=actualBand.concat(kept);
      }
    });
    if(U.frameless)band=actualBand;
    band=U.bool(U.bool(band,[],'union'),inner,'intersection');
    cuts=U.bool(cuts,[],'union');
    if(!untrimmedEnds)cuts=U.bool(cuts,band,'intersection');
    if(!cuts.length && !hasOmissions(b))throw Error('Mẫu viền không tạo được đường đục.');
    return {band:band,cuts:cuts,count:placements.length,runs:runInfo,placements:placements,cores:cores,envelopes:envelopes};
  }
  root.LofiCNCBorder={isBorder:isBorder,isPaired:isPaired,normalize:normalize,build:build,pairedDefaults:pairedDefaults,hasOmissions:hasOmissions,centerWithSides:centerWithSides,edgeFrame:edgeFrame,adjustFootprint:adjustFootprint,cleanPhotoCornerFragments:cleanPhotoCornerFragments};
})(typeof window==='undefined'?globalThis:window);
