import React, { useEffect, useState } from "react"
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { useLocation, Link } from 'react-router-dom';
import MultiSelect from 'multiselect-react-dropdown';


function ProductTemplate() {
    const location = useLocation()
    const products = location.state.products
    const [productTemplateName, setProductTemplateName] = useState('')
    const [selectedProductID, setSelectedProductID] = useState('')
    const [productNamePrompt, setProductNamePrompt] = useState('')
    const [productNameOld, setProductNameOld] = useState('Old Product Name')
    const [productNameNew, setProductNameNew] = useState('New Product Name')
    const [productDescriptionPrompt, setProductDescriptionPrompt] = useState('')
    const [productDescriptionOld, setProductDescriptionOld] = useState('Old Product Description')
    const [productDescriptionNew, setProductDescriptionNew] = useState('New Product Description')
    const [productPageTitlePrompt, setProductPageTitlePrompt] = useState('')
    const [productPageTitleOld, setProductPageTitleOld] = useState('Old Product Page Title')
    const [productPageTitleNew, setProductPageTitleNew] = useState('New Product Page Title')
    const [productMetaKeywordsPrompt, setProductMetaKeywordsPrompt] = useState('')
    const [productMetaKeywordsOld, setProductMetaKeywordsOld] = useState('Old Product Meta Keywords')
    const [productMetaKeyWordsNew, setProductMetaKeywordsNew] = useState('New Product Meta Keywords')
    const [productMetaDescriptionPrompt, setProductMetaDescriptionPrompt] = useState('')
    const [productMetaDescriptionOld, setProductMetaDescriptionOld] = useState('Old Product Meta Description')
    const [productMetaDescriptionNew, setProductMetaDescriptionNew] = useState('New Product Meta Description')
    const [filteredKeys, setFilteredKeys] = useState(new Set())
    const [saveMessage, setSaveMessage] = useState('')
    const [saveMessageVariant, setSaveMessageVariant] = useState('')
    const brands = location.state.brands
    const categories = location.state.categories

    const productMap = products.reduce((map, product) => {
        map[product.id] = product;
        return map;
    }, {});

    const stateMap = {
        'name': {'prompt': [productNamePrompt, setProductNamePrompt], 'old': [productNameOld, setProductNameOld], 'new':[productNameNew, setProductNameNew]},
        'description': {'prompt': [productDescriptionPrompt, setProductDescriptionPrompt], 'old': [productDescriptionOld, setProductDescriptionOld], 'new': [productDescriptionNew, setProductDescriptionNew]},
        'page_title': {'prompt': [productPageTitlePrompt, setProductPageTitlePrompt], 'old': [productPageTitleOld, setProductPageTitleOld], 'new': [productPageTitleNew, setProductPageTitleNew]},
        'meta_keywords': {'prompt': [productMetaKeywordsPrompt, setProductMetaKeywordsPrompt], 'old': [productMetaKeywordsOld, setProductMetaKeywordsOld], 'new': [productMetaKeyWordsNew, setProductMetaKeywordsNew]},
        'meta_description': {'prompt': [productMetaDescriptionPrompt, setProductMetaDescriptionPrompt], 'old': [productMetaDescriptionOld, setProductMetaDescriptionOld], 'new': [productMetaDescriptionNew, setProductMetaDescriptionNew]}
    }

    function ProductPageButton() {
        return (
        <Link to='/'>
            <h2>Back to Products</h2>
        </Link>
        )
    }

    useEffect(() => {
        if (products.length === 0) {
            return (
                <Row>
                    <Col>No Products found in store</Col>
                    <Col><ProductPageButton/></Col>
                </Row>
            )
        }
        else {
            setSelectedProductID(products[0]['id'])
        }
    }, [products])

    useEffect(() => {
        setSaveMessage('')
        setSaveMessageVariant('')
    }, [
        productNamePrompt, 
        productDescriptionPrompt, 
        productPageTitlePrompt, 
        productMetaDescriptionPrompt, 
        productMetaKeywordsPrompt, 
        productTemplateName, 
        filteredKeys])

    useEffect(() => {
        if (selectedProductID !== '') {
            for (const [key, value] of Object.entries(stateMap)) {
                value['old'][1](productMap[selectedProductID][key])
            }

        }}, [selectedProductID, productMap])

    async function getAIProductData(productID, data) {
        const product = productMap[productID]
        const filteredProduct = {}
        for (const key of filteredKeys) {
            if (Object.keys(data).includes(key)) {
            }
            else if (key === 'brand_id') {
                filteredProduct['brand'] = brands[product['brand_id']]
            }
            else if (key === 'categories') {
                filteredProduct['categories'] = product['categories'].map((id) => categories[id])
            }
            else {
                filteredProduct[key] = product[key]
            }
        }
        data['additional_product_info'] = filteredProduct
        const dataStr = JSON.stringify(data)
        const url = `${process.env.REACT_APP_BACKEND}/get_AI_product_data/?data=${encodeURIComponent(dataStr)}`
        const fetchConfig = {
            method:'GET',
            credentials:'include'
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            const newData = await response.json();
            const content = newData['new_attributes']
            for (const [key, value] of Object.entries(content)) {
                stateMap[key]["new"][1](value["new"])
            }
        }
    }

    const handleCreateProductInfo = (keyName) => {
        const data = {}
        data[keyName] = {'old': stateMap[keyName]['old'][0], 'prompt':stateMap[keyName]['prompt'][0]}
        getAIProductData(selectedProductID, data)
   }

    const handleTemplateSave = (e) => {
        e.preventDefault()
        saveTemplate()
        }

    async function saveTemplate() {
        const url = `${process.env.REACT_APP_BACKEND}/product_template/`
        const fetchConfig = {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            "template_name": productTemplateName,
            "name": productNamePrompt,
            "description": productDescriptionPrompt,
            "page_title": productPageTitlePrompt,
            "meta_description": productMetaDescriptionPrompt,
            "meta_keywords": productMetaKeywordsPrompt,
            "additional_product_info": Array.from(filteredKeys)
        })}
        const response = await fetch(url, fetchConfig);
        console.log(response)
        if (response.ok) {
            setSaveMessage("Template Successfully Saved")
            setSaveMessageVariant("success")
            }
        else if (response.status === 403) {
            setSaveMessage("Unable to save Template. Template Name already in use")
            setSaveMessageVariant('warning')
        }}
    
    function onKeyChange(Keys) {
        const keySet = new Set(Keys)
        setFilteredKeys(keySet)
   }

    function AttributeForm(props) {
        return (
            <>
            <Col className='col-2' style={{display:'flex', justifyContent:'center', alignItems:'center', verticalAlign:'middle', paddingBottom:'100px'}}>
            {props.name}
            </Col>
            <Col>
                <Form style={{paddingTop:'10px'}}>
                    <Row>
                        <Col>
                            <Form.Group className ="mb-3" style={{textSizeAdjust:'auto', marginBottom:'0px'}} controlId={`formProduct${props.keyName}Prompt`}>
                                <Form.Control 
                                    as="textarea" 
                                    type='text' 
                                    placeholder={`AI prompt for product ${props.name}`} 
                                    defaultValue={stateMap[props.keyName]['prompt'][0]}
                                    onBlur={() => stateMap[props.keyName]['prompt'][1](document.getElementById(`formProduct${props.keyName}Prompt`).value)}
                                    >
                                    
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                    <Row style={{textAlign:'center'}}>
                        <Col>Old {props.name}</Col>
                        <Col>New {props.name}</Col>
                    </Row>
                        <Col>
                            <Form.Group className ="mb-3" controlId={`formProduct${props.keyName}Old`}>
                                <Form.Control as="textarea" type="text" disabled placeholder={stateMap[props.keyName]['old'][0]}></Form.Control>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className ="mb-3" controlId={`formProduct${props.keyName}New`}>
                                <Form.Control as="textarea" type="text" disabled placeholder={stateMap[props.keyName]['new'][0]}></Form.Control>
                                
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Button 
                                variant='primary' 
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    stateMap[props.keyName]['prompt'][1](document.getElementById(`formProduct${props.keyName}Prompt`).value); 
                                    handleCreateProductInfo(props.keyName)}}>

                                Test Prompt
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Col>
            </>
        )
    }

    return (
        <>
        <Container style={{margin:'5px'}}>
            <Row style={{textAlign:'center', paddingBottom:'20px', fontSize:'20px'}}>
                <Col>
                    <h1>Product Template</h1>
                </Col>
                <Col>
                    <ProductPageButton/>
                </Col>
            </Row>
            <Row>
                <Col>
                    Name of Product Template:
                </Col>
                <Col>
                    <Form.Group className='mb-3' controlId="formProductTemplateName">
                        
                        <Form.Control type="text" onChange={(e)=> {e.preventDefault(); setProductTemplateName(e.target.value)}}>
                        </Form.Control>
                    </Form.Group>
                </Col>
            </Row>
            <Row>
                <Col>
                    Product to use for template:
                </Col>
                <Col>
                    <Form.Group className ="mb-3" controlId='formProductSelected'>
                        <Form.Select onChange={(e) => setSelectedProductID(e.target.value)}>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            <Row style={{paddingBottom:'50px'}}>
                <Col>
                    Product info needed for template:
                </Col>
                <Col>
                <MultiSelect
                        options = {Object.keys(products[0])}
                        isObject= {false}
                        onSelect = {onKeyChange}
                        onRemove = {onKeyChange}
                        displayValue = "name"
                        showCheckbox = {true}
                        closeOnSelect = {false}
                        style={{optionContainer: {maxHeight:'180px'}}}
                    />
                </Col>
            </Row>
            <Row style={{paddingBottom:'10px', borderTop:'3px solid black'}}>
                <AttributeForm name='Name' keyName='name'/>   
            </Row>
            <Row style={{paddingBottom:'10px', borderTop:'3px solid black'}}>
                <AttributeForm name='Description' keyName='description'/>
            </Row>
            <Row style={{paddingBottom:'10px', borderTop:'3px solid black'}}>
                <AttributeForm name='Page Title' keyName='page_title'/>
            </Row>
            <Row style={{paddingBottom:'10px', borderTop:'3px solid black'}}>
                <AttributeForm name='Meta Description' keyName='meta_description'/> 
            </Row>
            <Row style={{paddingBottom:'10px', borderTop:'3px solid black'}}>
                <AttributeForm name='Meta Keywords' keyName='meta_keywords'/>
            </Row>
            <Row style={{textAlign:'right'}}>
                <Row>
                    <Col>
                        <Button md={{span:2}} onClick={(e) => handleTemplateSave(e)}>Save Product Template</Button>
                    </Col>  
                </Row>
                <Row>
                    <Col>
                        <Alert variant={saveMessageVariant}>{saveMessage}</Alert>
                    </Col>
                </Row>
                 
            </Row>
        </Container>
        </>
    );
}

export default ProductTemplate;