import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  message,
  Modal,
  Flex,
  Row,
  Pagination,
  Tag,
  Col,
  Tooltip,
  Typography,
  Divider,
  Radio,
  Switch,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  getWords,
  deleteWord,
  getWordsCount,
  getWordsOnlyEN,
} from "../api/word";

const { Title, Link } = Typography;

const KoreanPage = () => {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [metadata, setMetadata] = useState({
    totalCount: 0,
    totalPage: 1,
  });

  const [currentCategory, setCurrentCategory] = useState("all");
  const [showOnlyMissingEnglish, setShowOnlyMissingEnglish] = useState(false);

  const [count, setCount] = useState({
    total: 0,
    basic: 0,
    daily_conversation: 0,
    topik_word: 0,
  });

  const showModal = () => {
    setOpen(true);
  };
  const hideModal = () => {
    setOpen(false);
  };

  const goToKoreanRegister = () => {
    navigate("/korean/register");
  };

  const getList = async (newPage = 1, newCategory = "all") => {
    try {
      let response;
      if (showOnlyMissingEnglish) {
        response = await getWordsOnlyEN({
          page: newPage,
          limit: 10,
          type: newCategory === "all" ? undefined : newCategory,
        });
      } else {
        response = await getWords({
          page: newPage,
          limit: 10,
          type: newCategory === "all" ? undefined : newCategory,
        });
      }

      if (response.status !== 200) {
        throw new Error("서버 에러");
      }

      const { totalCount, totalPage, words } = response.data;
      const data = words.map((item) => {
        return {
          ...item,
          key: item.id,
        };
      });
      setDataSource(data);
      setMetadata({
        totalCount,
        totalPage,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onDelete = async () => {
    const methods = [];
    selectedRowKeys.forEach(async (key) => {
      methods.push(deleteWord(key));
    });

    const response = await Promise.all(methods);

    message.success(selectedRowKeys.length + "개 단어가 삭제되었습니다.");

    // 선택된 keys 초기화, 목록 새로고침, 모달 닫기
    setSelectedRowKeys([]);
    setOpen(false);
    refresh();
  };

  const refresh = () => {
    if (page === 1) {
      getList(1);
    } else {
      setPage(1);
    }
  };

  const onSelectChange = (newSelectedRowKeys) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  useEffect(() => {
    getList(page, currentCategory);
  }, [page, currentCategory, showOnlyMissingEnglish]);

  const columns = [
    {
      title: "id",
      dataIndex: "id",
      key: "id",
      width: 10,
    },
    {
      title: "카테고리",
      dataIndex: "type",
      key: "type",
      width: 100,
      align: "center",
      render: (type) => {
        let color = "blue";
        switch (type) {
          case "daily_conversation":
            color = "green";
            break;
          case "kpop_lyrics":
            color = "blue";
            break;
          case "topik_word":
            color = "purple";
            break;
          case "basic":
            color = "orange";
            break;

          default:
            break;
        }
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "단어",
      dataIndex: "korean",
      key: "korean",
      width: "30%",
      render: (korean, row) => {
        return (
          <Col>
            <p style={{ fontWeight: "bold", fontSize: 14, marginBottom: 0 }}>
              {korean}
            </p>
            <p
              style={{
                color: "#888888",
                fontSize: 12,
                marginBottom: 0,
              }}
            >
              [
              <span
                style={{
                  fontStyle: "italic",
                }}
              >
                {row.pronunciation}
              </span>
              ]
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#555555",
              }}
            >
              {row.description}
            </p>
          </Col>
        );
      },
    },
    {
      title: "영어 설명",
      dataIndex: "en_description",
      key: "en_description",
      width: "20%",
      render: (en_description) => (
        <p style={{ fontSize: 12, color: "#555555" }}>
          {en_description || "미입력"}
        </p>
      ),
    },
    {
      title: "예문",
      dataIndex: "example_1",
      key: "example_1",
      width: "30%",
      render: (example_1, row) => {
        return (
          <Col>
            <p style={{ fontWeight: "bold", fontSize: 14, marginBottom: 0 }}>
              {example_1}
            </p>
            <p
              style={{
                color: "#888888",
                fontSize: 12,
                marginBottom: 0,
              }}
            >
              [
              <span
                style={{
                  fontStyle: "italic",
                }}
              >
                {row.example_2}
              </span>
              ]
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#555555",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {row.example_3}
            </p>
          </Col>
        );
      },
    },
    {
      title: "",
      width: "10%",
      dataIndex: "source",
      key: "source",
      render: (source, row) => (
        <Button onClick={() => navigate(`/korean/${row.id}`)}>수정</Button>
      ),
    },
  ];

  const onChangeCategory = (e) => {
    if (currentCategory === e.target.value) return;
    setPage(1);
    setCurrentCategory(e.target.value);
  };

  const getCounts = async () => {
    try {
      const response = await getWordsCount();

      if (response.status === 200) {
        const { basic, daily_conversation, topik_word } = response.data;
        setCount({
          basic,
          daily_conversation,
          topik_word,
          all: basic + daily_conversation + topik_word,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getCounts();
  }, []);

  const handleMissingEnglishSwitch = (checked) => {
    setShowOnlyMissingEnglish(checked);
    setPage(1);
  };

  return (
    <div>
      <Title level={2}>한국어 관리</Title>
      <Divider />
      <Flex gap="small" wrap>
        <Row
          style={{
            marginBottom: 20,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Radio.Group
            onChange={onChangeCategory}
            defaultValue="all"
            value={currentCategory}
            buttonStyle="solid"
          >
            <Radio.Button value="all">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                All
                <span
                  style={{
                    color: currentCategory === "all" ? "#1677ff" : "#fff",
                    fontSize: 12,
                    display: "flex",
                    height: 20,
                    minWidth: 30,
                    padding: "0 5px",
                    marginLeft: 10,
                    borderRadius: 10,
                    backgroundColor:
                      currentCategory === "all" ? "#fff" : "#999",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {count.all || "0"}
                </span>
              </div>
            </Radio.Button>
            <Radio.Button value="basic">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                basic
                <span
                  style={{
                    color: currentCategory === "basic" ? "#1677ff" : "#fff",
                    fontSize: 12,
                    display: "flex",
                    height: 20,

                    minWidth: 30,
                    padding: "0 5px",
                    marginLeft: 10,
                    borderRadius: 10,
                    backgroundColor:
                      currentCategory === "basic" ? "#fff" : "#999",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {count.basic}
                </span>
              </div>
            </Radio.Button>
            <Radio.Button value="daily_conversation">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                daily_conversation
                <span
                  style={{
                    color:
                      currentCategory === "daily_conversation"
                        ? "#1677ff"
                        : "#fff",
                    fontSize: 12,
                    display: "flex",
                    height: 20,
                    width: 20,
                    marginLeft: 10,
                    borderRadius: 10,
                    backgroundColor:
                      currentCategory === "daily_conversation"
                        ? "#fff"
                        : "#999",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {count.daily_conversation}
                </span>
              </div>
            </Radio.Button>
            <Radio.Button value="topik_word">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                topik_word
                <span
                  style={{
                    color:
                      currentCategory === "topik_word" ? "#1677ff" : "#fff",
                    fontSize: 12,
                    display: "flex",
                    height: 20,
                    width: 20,
                    marginLeft: 10,
                    borderRadius: 10,
                    backgroundColor:
                      currentCategory === "topik_word" ? "#fff" : "#999",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {count.topik_word}
                </span>
              </div>
            </Radio.Button>
          </Radio.Group>
        </Row>
        <Row
          justify="space-between"
          style={{ width: "100%", paddingBottom: 10 }}
        >
          <Row style={{ alignItems: "center" }}>
            <Button
              style={{
                marginRight: 6,
              }}
              onClick={goToKoreanRegister}
            >
              추가
            </Button>
            <Button
              type="dashed"
              onClick={showModal}
              disabled={selectedRowKeys.length === 0}
            >
              삭제
            </Button>
          </Row>
          <Row style={{ alignItems: "center" }}>
            <Col
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                // flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 10, color: "#888" }}>
                영어 입력 필터링
              </span>
              <Switch
                height={40}
                checkedChildren="영어 미입력"
                unCheckedChildren="전체"
                size="default"
                checked={showOnlyMissingEnglish}
                onChange={handleMissingEnglishSwitch}
              />
            </Col>

            <Pagination
              style={{ marginLeft: 20 }}
              current={page}
              showSizeChanger={false}
              pageSize={10}
              total={metadata.totalCount}
              onChange={(newPage) => {
                setPage(newPage);
              }}
            />
          </Row>
        </Row>
      </Flex>
      <Modal
        title="Delete"
        open={open}
        onOk={onDelete}
        onCancel={hideModal}
        okText="Ok"
        cancelText="Cancel"
      >
        <p>정말 삭제하시겠습니까?</p>
      </Modal>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowSelection={{
          ...rowSelection,
        }}
        pagination={false}
      />
    </div>
  );
};

export default KoreanPage;
