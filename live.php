<?php
    date_default_timezone_set('Europe/Istanbul');
    header("Access-Control-Allow-Origin: *");
    header('Content-type: application/json');

    include("env.php");

    $main_response=array("status"=>false);
    $result=[];
    $url=$_ENV['api']."?v=".time();

    /**
     * @param string $dateStr string biçiminde tarih bilgisi
     */
    function getUnixTime($dateStr){
        $date=new DateTime($dateStr, new DateTimeZone("Europe/Istanbul"));
        return (int)$date->format('U');
    }

    /**
     * @param xml $xmlnode xml datası
     */
    function xml2js($xmlnode) {
        $root = (func_num_args() > 1 ? false : true);
        $jsnode = array();
    
        if (!$root) {
            if (count($xmlnode->attributes()) > 0){
                $jsnode[] = array();
                foreach($xmlnode->attributes() as $key => $value){
                    $jsnode[$key] = (string)$value;
                }
            }
            foreach ($xmlnode->children() as $childxmlnode) {
                $childname = $childxmlnode->getName();
                if (!array_key_exists($childname, $jsnode))
                    $jsnode[$childname] = array();
                array_push($jsnode[$childname], xml2js($childxmlnode, true));
            }
            return $jsnode;
        } else {
            $nodename = $xmlnode->getName();
            $jsnode[$nodename] = array();
            array_push($jsnode[$nodename], xml2js($xmlnode, true));
            $jsnode=$jsnode['eqlist'][0]['earhquake'];
            foreach($jsnode as $key=>$node){
                unset($node[0]);
                $node['depth']=$node['Depth'];
                unset($node['Depth']);
                $node['lokasyon']=trim(preg_replace('/\s+/', ' ', $node['lokasyon']));
                $exploded=explode(')', $node['lokasyon']);
                if($exploded && count($exploded)>2){
                    $node['title']=$exploded[0].")";
                    $node['rev']=trim(preg_replace('/\s+/', ' ', $exploded[1].")"));
                }else{
                    $node['title']=$exploded[0];
                    if(strpos($exploded[0], '(')){
                        $node['title'].=")";
                    }
                    $node['rev']=null;  
                }
                $node['timestamp']=getUnixTime(str_replace('.', '/', $node['name']));
                $node['date']=$node['name'];
                unset($node['name']);
                $node['hash']=md5($node['date'].$node['timestamp'].$node['lokasyon'].$node['lat'].$node['lng'].$node['mag'].$node['depth']);
                $jsnode[$key]=$node;
            }
            return array_reverse($jsnode);
        }
    }
    
    $xml = @simplexml_load_file($url);
    if($xml){
        $result=xml2js($xml);
    }
    
    if(count($result)>0){
        $main_response['status']=true;
        $main_response['result']=$result;
    }
    echo json_encode($main_response);
?>