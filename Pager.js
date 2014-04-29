module.exports =  function pager(count,page,limit,groupMaxPageNum){
    // page info
    var groupNum = 1,
        groupMaxPageNum = groupMaxPageNum || 3,
        itemNum = limit;

    var pg = {};

    var page = pg.page = page || 1;
    var pagenum = pg.pagenum = Math.floor(count / itemNum) + ( count % itemNum ? 1 : 0);

    groupNum = Math.floor(page / (groupMaxPageNum - 1)) + ((page % (groupMaxPageNum - 1)) ? 1 : 0);
    pg.groupNum = groupNum;

    pg.groupMaxPageNum = groupMaxPageNum;

    return pg;
}