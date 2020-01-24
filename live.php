<?php
    date_default_timezone_set('Europe/Istanbul');
    header("Access-Control-Allow-Origin: *");
    header('Content-type: application/json');

    include("funcs.php");

    $main_response=array("status"=>false);
    $result=[];

    /**
     * @param string $dateStr string biçiminde tarih bilgisi
     */
    function getUnixTime($dateStr){
        $date=new DateTime($dateStr, new DateTimeZone("Europe/Istanbul"));
        return (int)$date->format('U');
    }

    /**
     * @param xml $xmlnode xml datası
     * 
     * deprem verileri xml şeklinde gelmekte parse edip jsone çeviriyoruz bu function ile.
     */
    function xml2js($xmlnode) {
        /**
         * argumentların sayısını alıp 1 den büyükse true döndürüyoruz. eğer değilse false dönderiyoruz.
         */
        $root = (func_num_args() > 1 ? false : true);
        /**
         * ana array yaratıyoruz.
         */
        $jsnode = array();
    
        if (!$root) {
            /**
             * eğer attribute 0 dan bütükse foreachle her attribute ana arraya gönderiyoruz.
             */
            if (count($xmlnode->attributes()) > 0){
                $jsnode[] = array();
                foreach($xmlnode->attributes() as $key => $value){
                    $jsnode[$key] = (string)$value;
                }
            }
            /**
             * eğer bir childi arraye dahil ediyoruz.
             */
            foreach ($xmlnode->children() as $childxmlnode) {
                $childname = $childxmlnode->getName();
                if (!array_key_exists($childname, $jsnode))
                    $jsnode[$childname] = array();
                array_push($jsnode[$childname], xml2js($childxmlnode, true));
            }
            return array_reverse($jsnode);

        } else {
            $nodename = $xmlnode->getName();
            $jsnode[$nodename] = array();
            array_push($jsnode[$nodename], xml2js($xmlnode, true));
            $jsnode=$jsnode['eqlist'][0]['earhquake'];
            /**
             * her bir xml de ki veriyi arraye dahil ediyoruz.
             */
            foreach($jsnode as $key=>$node){
                unset($node[0]); // gereksiz veriyi siliyoruz.
                $node['depth']=$node['Depth']; // Büyük hardten küçük harfe çeviyoruz.
                unset($node['Depth']); // eski büyük harf verisini siliyoruz.
                $node['lokasyon']=trim(preg_replace('/\s+/', ' ', $node['lokasyon'])); // gereksiz boşlukları siliyoruz.
                $exploded=explode(')', $node['lokasyon']); // verileri parçalıyoruz. revize ve deprem bölgesi gibi verileri almak için.
                $node['lng']=(double)$node['lng'];
                $node['lat']=(double)$node['lat'];
                $node['coordinates']=[(double)$node['lng'], (double)$node['lat']];
                $node['mag']=(double)$node['mag'];
                $node['depth']=(double)$node['depth'];
                /**
                 * eğer parçalanan veri varsa ve 2 den büyükse veri.
                 */
                if($exploded && count($exploded)>2){

                    $node['title']=$exploded[0].")"; // title nın sonuna ) ekliyoruz.
                    $node['rev']=trim(preg_replace('/\s+/', ' ', $exploded[1].")")); // revizenin sonuna ) ekliyoruz.

                }else{ // eğer parçalanan veri 2 ve küçükse.
                    $node['title']=$exploded[0]; // title ekliyoruz.

                    if(strpos($exploded[0], '(')){ // ve parantez varsa kapanışı olmadığından aşağıda parantez ekliyoruz.
                        $node['title'].=")";
                    }

                    $node['rev']=null; // parçalanan veriden revize verisi yoksa null geçiyoruz.
                }

                $node['timestamp']=getUnixTime(str_replace('.', '/', $node['name'])); // gelen tarih bilgisiniz unix timestampe çeviyoruz.
                $node['date_stamp']=gmdate("Y-m-d", $node['timestamp']+3600*(-3+date("I"))); // gelen tarih bilgisiniz unix timestampe çeviyoruz.
                $node['date']=$node['name']; // date bilgisi atıyoruz. deprem tarih bilgisi name içinde geliyor.
                unset($node['name']); // işimiz kalmadığından siliyoruz.
                $node['hash']=md5($node['date'].$node['timestamp'].$node['lokasyon'].$node['lat'].$node['lng'].$node['mag'].$node['depth']); // benzersiz deprem hashi oluşturoruz.
                $node['hash2']=md5($node['lat'].$node['lng']); // benzersiz deprem hashi oluşturoruz.
                $jsnode[$key]=$node;
            }
            return array_reverse($jsnode);
        }
    }
    
    /**
     * xml çekiyoruz.
     */
    $xml = @simplexml_load_file($_ENV['api']."?v=".time());

    /**
     * eğer xml çekildiyse parçamalak için functionu çağıyoruz.
     */
    if($xml){
        $result=xml2js($xml);
    }
    
    /**
     * eğer xml başarılı bir şekilde işlendiyse.
     */
    $count = count($result);
    if($count>0){
        if(isset($_GET['limit']) && $count > (int)$_GET['limit']){
            $_GET['limit'] = (int)$_GET['limit'];
            if($_GET['limit']>0){
                $result = array_slice($result, 0, $_GET['limit']);
            }
        }
        $main_response['status']=true;
        $main_response['result']=$result;
    }
    
    // :)))
    echo json_encode($main_response);
?>